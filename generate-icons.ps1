Add-Type -AssemblyName System.Drawing

$sizes = @(192, 512)
$colors = @('#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#9b59b6','#e67e22','#1abc9c','#e84393')

$blocks = @(
    @(1,2),@(1,3),@(1,4),
    @(2,2),@(2,4),@(2,5),
    @(3,1),@(3,2),@(3,3),@(3,4),
    @(4,2),@(4,3),@(4,5),
    @(5,3),@(5,4),@(5,5)
)

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(10, 14, 26))

    $u = $s / 8.0
    $i = 0

    foreach ($b in $blocks) {
        $r = $b[0]
        $c = $b[1]
        $gap = $u * 0.1
        $x = $c * $u + $gap
        $y = $r * $u + $gap
        $bw = $u - $gap * 2
        $color = [System.Drawing.ColorTranslator]::FromHtml($colors[$i % 8])
        $brush = New-Object System.Drawing.SolidBrush($color)
        $g.FillRectangle($brush, [float]$x, [float]$y, [float]$bw, [float]$bw)
        $brush.Dispose()
        $i++
    }

    $g.Dispose()
    $outPath = "c:\Users\stajyer\Desktop\Block_App\icons\icon-$s.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outPath"
}
