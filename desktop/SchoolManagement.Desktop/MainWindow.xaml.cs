using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace SchoolManagement.Desktop;

public partial class MainWindow : Window
{
    private static readonly Uri SystemUri = new("https://smis.kshs.ac.ug/");

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        try
        {
            await SystemView.EnsureCoreWebView2Async();
            var settings = SystemView.CoreWebView2.Settings;
            settings.AreDefaultContextMenusEnabled = false;
            settings.AreDevToolsEnabled = false;
            settings.IsStatusBarEnabled = false;
            settings.AreBrowserAcceleratorKeysEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.IsPinchZoomEnabled = false;

            SystemView.CoreWebView2.NavigationStarting += (_, args) =>
            {
                if (!IsTrustedNavigation(args.Uri))
                    args.Cancel = true;
            };

            SystemView.CoreWebView2.NewWindowRequested += (_, args) =>
            {
                args.Handled = true;
                if (IsTrustedNavigation(args.Uri))
                    SystemView.CoreWebView2.Navigate(args.Uri);
            };

            SystemView.Source = SystemUri;
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"The School Management System could not be opened.\n\n{ex.Message}",
                "School Management Information System",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    private static bool IsTrustedNavigation(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && uri.Scheme == Uri.UriSchemeHttps
            && uri.Host.Equals(SystemUri.Host, StringComparison.OrdinalIgnoreCase);
    }
}
