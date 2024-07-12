import {promises as fsp} from "fs";

export async function performanceLog(description:string) {
    const path = "/Users/federico/repos/code-insight-studio/backend/performance-log.csv"
    await fsp.appendFile(
        path, `"${description}",${Date.now()},\n`
    );
}
