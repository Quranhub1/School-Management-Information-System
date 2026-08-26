using System.Text;

namespace SchoolManagement.Api.Helpers;

public static class BarcodeHelper
{
    public static string GenerateSvg(string text, int width = 300, int height = 100)
    {
        if (string.IsNullOrEmpty(text))
            throw new ArgumentException("Text cannot be empty.", nameof(text));

        var bytes = Encoding.UTF8.GetBytes(text);
        var barWidth = (double)width / (bytes.Length * 8 * 2 + 1);
        var quietZone = barWidth * 3;
        var barHeight = height - 20;
        var svgWidth = quietZone * 2 + bytes.Length * 8 * 2 * barWidth + barWidth;

        var sb = new StringBuilder();
        sb.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {svgWidth} {height}\" width=\"{svgWidth}\" height=\"{height}\">");
        sb.Append($"<rect width=\"{svgWidth}\" height=\"{height}\" fill=\"#ffffff\"/>");

        var x = quietZone;
        foreach (var b in bytes)
        {
            for (var i = 7; i >= 0; i--)
            {
                var isBar = (b & (1 << i)) != 0;
                var elementWidth = isBar ? barWidth * 2 : barWidth;
                if (isBar)
                {
                    sb.Append($"<rect x=\"{x}\" y=\"10\" width=\"{elementWidth}\" height=\"{barHeight}\" fill=\"#000000\"/>");
                }
                x += elementWidth;
            }
        }

        sb.Append($"<text x=\"{svgWidth / 2}\" y=\"{(int)(height - 2)}\" text-anchor=\"middle\" font-family=\"monospace\" font-size=\"12\">{System.Net.WebUtility.HtmlEncode(text)}</text>");
        sb.Append("</svg>");

        return $"data:image/svg+xml;base64,{Convert.ToBase64String(Encoding.UTF8.GetBytes(sb.ToString()))}";
    }
}
