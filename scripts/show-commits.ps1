# PowerShell script to show git commit details for up to 4 commits and save to files
[CmdletBinding()]
param(
    # Accept 1 to 4 commit hashes
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateCount(1,4)]
    [string[]] $CommitHashes,

    # Optional: a single output file to append everything to (if provided).
    # If omitted, one file per commit will be created: commit-<short>.txt
    [Parameter(Position = 1)]
    [string] $OutputFile = ""
)

function Write-CommitReport {
    param(
        [Parameter(Mandatory = $true)]
        [string] $CommitHash,

        [Parameter(Mandatory = $true)]
        [string] $TargetFile,

        [switch] $Append
    )

    # Resolve a short hash for naming
    $shortHash = $CommitHash.Substring(0, [Math]::Min(7, $CommitHash.Length))

    # Check if commit exists and is readable (not just in reflog)
    # Use 'git cat-file -e' which checks if object exists AND is readable
    git cat-file -e $CommitHash 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $msg = "`n[ERROR] Commit '$CommitHash' not found or not readable in this repo.`nThe commit may have been garbage collected or is in a shallow clone.`n"
        if ($Append) {
            $msg | Out-File -FilePath $TargetFile -Encoding utf8 -Append
        } else {
            $msg | Out-File -FilePath $TargetFile -Encoding utf8
        }
        return
    }

    $header = @"
========================================
COMMIT $CommitHash  (short: $shortHash)
========================================
"@

    $meta = git show --no-patch --pretty=fuller $CommitHash 2>&1
    $stat = git show $CommitHash --stat --format="" 2>&1
    $raw  = git cat-file -p $CommitHash 2>&1
    $patch = git show $CommitHash --format="" 2>&1

    $body = @"
$header

----------------------------------------
METADATA (git show --no-patch --pretty=fuller)
----------------------------------------
$meta

----------------------------------------
FILES CHANGED (git show --stat)
----------------------------------------
$stat

----------------------------------------
RAW COMMIT (git cat-file -p)
----------------------------------------
$raw

----------------------------------------
PATCH (git show)
----------------------------------------
$patch

"@

    if ($Append) {
        $body | Out-File -FilePath $TargetFile -Encoding utf8 -Append
    } else {
        $body | Out-File -FilePath $TargetFile -Encoding utf8
    }
}

# If a single OutputFile is provided, we append all selected commits to it.
if (-not [string]::IsNullOrWhiteSpace($OutputFile)) {
    # Ensure directory exists if user passed a path
    $dir = Split-Path -Parent $OutputFile
    if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }

    # Clear existing file
    "" | Out-File -FilePath $OutputFile -Encoding utf8

    foreach ($hash in $CommitHashes) {
        Write-CommitReport -CommitHash $hash -TargetFile $OutputFile -Append
    }

    Write-Host "`nCommit details saved to: $OutputFile"
    Write-Host "File size: $((Get-Item $OutputFile).Length) bytes"
}
else {
    # No OutputFile provided: create one file per commit (commit-<short>.txt)
    foreach ($hash in $CommitHashes) {
        $short = $hash.Substring(0, [Math]::Min(7, $hash.Length))
        $file = "commit-$short.txt"
        Write-CommitReport -CommitHash $hash -TargetFile $file
        Write-Host "Saved: $file  ($((Get-Item $file).Length) bytes)"
    }
}
