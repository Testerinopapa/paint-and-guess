# PowerShell script to show git commit details and save to file
param(
    [Parameter(Mandatory=$true)]
    [string]$CommitHash,
    
    [string]$OutputFile = ""
)

# Generate output filename if not provided
if ([string]::IsNullOrEmpty($OutputFile)) {
    $shortHash = $CommitHash.Substring(0, 7)
    $OutputFile = "commit-${shortHash}.txt"
}

Write-Host "Fetching commit details for: $CommitHash"
Write-Host "Output will be saved to: $OutputFile"

# Get commit info with full details
$commitInfo = git show $CommitHash --format=fuller --stat --no-patch 2>&1
$commitDiff = git show $CommitHash --format="" 2>&1

# Combine everything
$fullOutput = @"
========================================
COMMIT INFORMATION
========================================
$commitInfo

========================================
FULL DIFF
========================================
$commitDiff

========================================
ADDITIONAL DETAILS
========================================
Commit Hash: $CommitHash
Full Hash: $(git rev-parse $CommitHash 2>&1)
Parent(s): $(git show --format='%P' --no-patch $CommitHash 2>&1)
Tree: $(git show --format='%T' --no-patch $CommitHash 2>&1)

========================================
FILE STATISTICS
========================================
$(git show $CommitHash --stat --format="" 2>&1)

========================================
RAW COMMIT DATA
========================================
$(git cat-file -p $CommitHash 2>&1)
"@

# Write to file
$fullOutput | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host "`nCommit details saved to: $OutputFile"
Write-Host "File size: $((Get-Item $OutputFile).Length) bytes"

