Add-Type -AssemblyName System.Drawing

# Create a simple screenshot image (1080x1920 phone portrait)
$w = 1080
$h = 1920
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'

# Dark background
$g.Clear([System.Drawing.Color]::FromArgb(10, 14, 26))

# Title
$titleFont = New-Object System.Drawing.Font("Arial", 48, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("Block Blast!", $titleFont, $whiteBrush, 300, 100)

# Draw grid (8x8)
$gridX = 60
$gridY = 300
$cellSize = 120
$gap = 4
$colors = @('#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#9b59b6','#e67e22','#1abc9c','#e84393')

# Empty grid cells
$emptyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 35, 55))
for ($r = 0; $r -lt 8; $r++) {
    for ($c = 0; $c -lt 8; $c++) {
        $x = $gridX + $c * ($cellSize + $gap)
        $y = $gridY + $r * ($cellSize + $gap)
        $g.FillRectangle($emptyBrush, $x, $y, $cellSize, $cellSize)
    }
}

# Some filled blocks
$filledBlocks = @(
    @(5,0,'#ff6b6b'),@(5,1,'#ff6b6b'),@(5,2,'#ff6b6b'),
    @(6,0,'#ffd93d'),@(6,1,'#ffd93d'),@(6,2,'#ffd93d'),@(6,3,'#ffd93d'),
    @(7,0,'#6bcb77'),@(7,1,'#6bcb77'),@(7,2,'#6bcb77'),@(7,3,'#6bcb77'),@(7,4,'#6bcb77'),@(7,5,'#4d96ff'),@(7,6,'#4d96ff'),@(7,7,'#4d96ff'),
    @(4,6,'#9b59b6'),@(4,7,'#9b59b6'),@(5,7,'#9b59b6'),
    @(6,5,'#e67e22'),@(6,6,'#e67e22'),@(6,7,'#e67e22')
)

foreach ($fb in $filledBlocks) {
    $r = $fb[0]; $c = $fb[1]; $color = $fb[2]
    $x = $gridX + $c * ($cellSize + $gap)
    $y = $gridY + $r * ($cellSize + $gap)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
    $g.FillRectangle($brush, $x, $y, $cellSize, $cellSize)
    $brush.Dispose()
}

# Score text
$scoreFont = New-Object System.Drawing.Font("Arial", 36, [System.Drawing.FontStyle]::Bold)
$g.DrawString("SKOR: 1250", $scoreFont, $whiteBrush, 60, 220)
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(136, 146, 176))
$g.DrawString("EN IYI: 3400", $scoreFont, $grayBrush, 600, 220)

# Piece tray area
$trayY = 1400
$g.FillRectangle($emptyBrush, 40, $trayY, 1000, 300)

# Draw some pieces in tray
$pColors = @('#1abc9c', '#e84393', '#4d96ff')
$pSize = 60
# Piece 1: L-shape
foreach ($pos in @(@(0,0),@(1,0),@(1,1))) {
    $px = 120 + $pos[1] * ($pSize + 3)
    $py = $trayY + 60 + $pos[0] * ($pSize + 3)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($pColors[0]))
    $g.FillRectangle($brush, $px, $py, $pSize, $pSize)
    $brush.Dispose()
}
# Piece 2: 1x3
foreach ($pos in @(@(0,0),@(0,1),@(0,2))) {
    $px = 400 + $pos[1] * ($pSize + 3)
    $py = $trayY + 90 + $pos[0] * ($pSize + 3)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($pColors[1]))
    $g.FillRectangle($brush, $px, $py, $pSize, $pSize)
    $brush.Dispose()
}
# Piece 3: 2x2
foreach ($pos in @(@(0,0),@(0,1),@(1,0),@(1,1))) {
    $px = 730 + $pos[1] * ($pSize + 3)
    $py = $trayY + 60 + $pos[0] * ($pSize + 3)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($pColors[2]))
    $g.FillRectangle($brush, $px, $py, $pSize, $pSize)
    $brush.Dispose()
}

$g.Dispose()
$bmp.Save("c:\Users\stajyer\Desktop\Block_App\icons\screenshot.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Created screenshot.png (1080x1920)"
