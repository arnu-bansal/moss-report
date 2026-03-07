const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Create 2 test C files
const testDir = path.join(__dirname, "test-tmp");
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);

fs.writeFileSync(path.join(testDir, "student1.c"), `
#include <stdio.h>
int main() {
    int a = 5, b = 10;
    printf("%d", a + b);
    return 0;
}
`);

fs.writeFileSync(path.join(testDir, "student2.c"), `
#include <stdio.h>
int main() {
    int a = 5, b = 10;
    printf("%d", a + b);
    return 0;
}
`);

const mossScript = path.join(__dirname, "moss.pl");
const cmd = "perl " + mossScript + " -l c " + path.join(testDir, "student1.c") + " " + path.join(testDir, "student2.c");

console.log("Running:", cmd);
exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
    if (err) console.log("ERROR:", err.message);
    fs.rmSync(testDir, { recursive: true, force: true });
});