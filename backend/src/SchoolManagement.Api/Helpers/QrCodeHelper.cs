using System.Text;

namespace SchoolManagement.Api.Helpers;

public static class QrCodeHelper
{
    private static readonly byte[] GfExp = new byte[512];
    private static readonly byte[] GfLog = new byte[256];

    static QrCodeHelper()
    {
        var x = 1;
        for (var i = 0; i < 255; i++)
        {
            GfExp[i] = (byte)x;
            GfLog[x] = (byte)i;
            x <<= 1;
            if ((x & 0x100) != 0) x ^= 0x11D;
        }
        for (var i = 255; i < 512; i++)
            GfExp[i] = GfExp[i - 255];
    }

    public static string GenerateSvg(string text, int size = 200)
    {
        if (string.IsNullOrEmpty(text))
            throw new ArgumentException("Text cannot be empty.", nameof(text));

        var bytes = Encoding.UTF8.GetBytes(text);
        if (bytes.Length > 19)
            throw new ArgumentException("Text is too long for QR code.", nameof(text));

        var moduleCount = 21;
        var ecBytes = 7;

        var dataCodewords = EncodeData(bytes, 19);
        var ecCodewords = ComputeErrorCorrection(dataCodewords, ecBytes);

        var matrix = new bool[moduleCount, moduleCount];
        PlaceData(matrix, dataCodewords.Concat(ecCodewords).ToArray(), moduleCount);
        AddFinderPatterns(matrix, moduleCount);
        AddTimingPatterns(matrix, moduleCount);
        AddFormatInfo(matrix, moduleCount);
        AddDarkModule(matrix, moduleCount);

        var moduleSize = (double)size / moduleCount;
        var svgSize = moduleSize * moduleCount;

        var sb = new StringBuilder();
        sb.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {svgSize} {svgSize}\" width=\"{size}\" height=\"{size}\">");
        sb.Append($"<rect width=\"{size}\" height=\"{size}\" fill=\"#ffffff\"/>");

        for (var row = 0; row < moduleCount; row++)
            for (var col = 0; col < moduleCount; col++)
                if (matrix[row, col])
                    sb.Append($"<rect x=\"{col * moduleSize}\" y=\"{row * moduleSize}\" width=\"{moduleSize}\" height=\"{moduleSize}\" fill=\"#000000\"/>");

        sb.Append("</svg>");
        return $"data:image/svg+xml;base64,{Convert.ToBase64String(Encoding.UTF8.GetBytes(sb.ToString()))}";
    }

    private static byte[] EncodeData(byte[] input, int totalDataBytes)
    {
        var buffer = new List<byte>();
        buffer.Add(0x40); // Byte mode indicator
        buffer.Add((byte)input.Length); // Character count (8-bit for versions 1-9)
        buffer.AddRange(input);

        var padBytes = new[] { (byte)0xEC, (byte)0x11 };
        var padIndex = 0;
        while (buffer.Count < totalDataBytes)
        {
            buffer.Add(padBytes[padIndex % 2]);
            padIndex++;
        }

        return buffer.ToArray();
    }

    private static byte[] ComputeErrorCorrection(byte[] data, int ecBytes)
    {
        var gen = ComputeGeneratorPolynomial(ecBytes);

        var result = new byte[ecBytes + 1];
        foreach (var b in data)
        {
            var coef = (byte)(result[0] ^ b);
            for (var i = 0; i < ecBytes; i++)
                result[i] = (byte)(result[i + 1] ^ GfMul(gen[i + 1], coef));
        }

        var ec = new byte[ecBytes];
        Array.Copy(result, 0, ec, 0, ecBytes);
        return ec;
    }

    private static byte[] ComputeGeneratorPolynomial(int ecBytes)
    {
        var gen = new byte[ecBytes + 1];
        gen[ecBytes] = 1;

        for (var i = 0; i < ecBytes; i++)
        {
            var c = GfExp[i];
            for (var j = ecBytes; j > 0; j--)
                gen[j] = (byte)(GfMul(gen[j], c) ^ gen[j - 1]);
            gen[0] = GfMul(gen[0], c);
        }

        return gen;
    }

    private static byte GfMul(byte a, byte b)
    {
        if (a == 0 || b == 0) return 0;
        return GfExp[GfLog[a] + GfLog[b]];
    }

    private static void PlaceData(bool[,] matrix, byte[] codewords, int moduleCount)
    {
        var bitIndex = 0;
        var upward = true;
        for (var col = moduleCount - 1; col > 0; col -= 2)
        {
            if (col == 6) col--;
            for (var row = upward ? moduleCount - 1 : 0; upward ? row >= 0 : row < moduleCount; upward ? row-- : row++)
            {
                for (var c = 0; c < 2; c++)
                {
                    var x = col - c;
                    if (IsReserved(matrix, row, x, moduleCount)) continue;
                    if (bitIndex < codewords.Length * 8)
                    {
                        var byteIndex = bitIndex / 8;
                        var bitOffset = 7 - (bitIndex % 8);
                        matrix[row, x] = (codewords[byteIndex] & (1 << bitOffset)) != 0;
                        bitIndex++;
                    }
                    else
                    {
                        matrix[row, x] = false;
                    }
                }
            }
            upward = !upward;
        }
    }

    private static bool IsReserved(bool[,] matrix, int row, int col, int moduleCount)
    {
        return IsInFinderPattern(row, col, moduleCount) || (row == 6 && col >= 8 && col <= moduleCount - 9) || (col == 6 && row >= 8 && row <= moduleCount - 9);
    }

    private static void AddFinderPatterns(bool[,] matrix, int moduleCount)
    {
        PlacePattern(matrix, 0, 0);
        PlacePattern(matrix, moduleCount - 7, 0);
        PlacePattern(matrix, 0, moduleCount - 7);
    }

    private static void PlacePattern(bool[,] matrix, int row, int col)
    {
        for (var r = 0; r < 7; r++)
            for (var c = 0; c < 7; c++)
                matrix[row + r, col + c] = r is 0 or 6 || c is 0 or 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }

    private static bool IsInFinderPattern(int row, int col, int moduleCount)
    {
        return (row < 9 && col < 9) || (row < 9 && col >= moduleCount - 8) || (row >= moduleCount - 8 && col < 9);
    }

    private static void AddTimingPatterns(bool[,] matrix, int moduleCount)
    {
        for (var i = 8; i < moduleCount - 8; i++)
        {
            matrix[6, i] = i % 2 == 0;
            matrix[i, 6] = i % 2 == 0;
        }
    }

    private static void AddFormatInfo(bool[,] matrix, int moduleCount)
    {
        var formatBits = 0x0000;
        for (var i = 0; i < 6; i++)
        {
            matrix[8, i] = (formatBits & (1 << i)) != 0;
            matrix[i, 8] = (formatBits & (1 << (14 - i))) != 0;
        }
        matrix[8, 7] = (formatBits & (1 << 6)) != 0;
        matrix[8, 8] = (formatBits & (1 << 7)) != 0;
        matrix[7, 8] = (formatBits & (1 << 8)) != 0;

        for (var i = 0; i < 6; i++)
            matrix[moduleCount - 1 - i, 8] = (formatBits & (1 << i)) != 0;
        matrix[8, moduleCount - 8] = (formatBits & (1 << 6)) != 0;
        matrix[8, moduleCount - 7] = (formatBits & (1 << 7)) != 0;
        matrix[8, moduleCount - 6] = (formatBits & (1 << 8)) != 0;
    }

    private static void AddDarkModule(bool[,] matrix, int moduleCount)
    {
        matrix[moduleCount - 8, 8] = true;
    }
}
