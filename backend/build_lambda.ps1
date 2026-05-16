param (
    [Parameter(Mandatory=$true)]
    [string]$FunctionName
)

$ErrorActionPreference = "Stop"

$BackendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $BackendRoot
$BuildRoot = Join-Path $ProjectRoot "build"
$FunctionSource = Join-Path $BackendRoot "lambdas\$FunctionName"
$BuildFunctionDir = Join-Path $BuildRoot $FunctionName
$ZipPath = Join-Path $BuildRoot "$FunctionName.zip"

if (!(Test-Path $FunctionSource)) {
    Write-Error "Lambda folder not found: $FunctionSource"
}

if (Test-Path $BuildFunctionDir) {
    Remove-Item $BuildFunctionDir -Recurse -Force
}

if (!(Test-Path $BuildRoot)) {
    New-Item -ItemType Directory -Path $BuildRoot | Out-Null
}

New-Item -ItemType Directory -Path $BuildFunctionDir | Out-Null

Copy-Item "$FunctionSource\lambda_function.py" $BuildFunctionDir

Copy-Item "$BackendRoot\shared" "$BuildFunctionDir\shared" -Recurse
Copy-Item "$BackendRoot\config" "$BuildFunctionDir\config" -Recurse

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Compress-Archive -Path "$BuildFunctionDir\*" -DestinationPath $ZipPath -Force

Write-Host "Created Lambda package: $ZipPath"