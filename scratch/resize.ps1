Add-Type -AssemblyName System.Drawing
$logoPath = "D:\webmaa\public\logo.png"
$sizes = @(
    @{ Path = "D:\webmaa\public\favicon-16x16.png"; Width = 16; Height = 16 }
    @{ Path = "D:\webmaa\public\favicon-32x32.png"; Width = 32; Height = 32 }
    @{ Path = "D:\webmaa\public\favicon.ico"; Width = 32; Height = 32 }
    @{ Path = "D:\webmaa\public\apple-touch-icon.png"; Width = 180; Height = 180 }
    @{ Path = "D:\webmaa\public\android-chrome-192x192.png"; Width = 192; Height = 192 }
    @{ Path = "D:\webmaa\public\android-chrome-512x512.png"; Width = 512; Height = 512 }
)

if (Test-Path $logoPath) {
    $srcImage = [System.Drawing.Image]::FromFile($logoPath)
    foreach ($size in $sizes) {
        $destBitmap = New-Object System.Drawing.Bitmap($size.Width, $size.Height)
        $graphic = [System.Drawing.Graphics]::FromImage($destBitmap)
        $graphic.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphic.DrawImage($srcImage, 0, 0, $size.Width, $size.Height)
        $graphic.Dispose()
        
        # Save as format (ico can also be saved as PNG stream, browsers load it perfectly)
        if ($size.Path.EndsWith(".ico")) {
            # Save as PNG format into .ico extension
            $destBitmap.Save($size.Path, [System.Drawing.Imaging.ImageFormat]::Png)
        } else {
            $destBitmap.Save($size.Path, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        $destBitmap.Dispose()
        Write-Host "Generated: $($size.Path)"
    }
    $srcImage.Dispose()
    Write-Host "All sizes generated successfully!"
} else {
    Write-Host "Error: logo.png not found at $logoPath"
}
