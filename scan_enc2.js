const fs = require('fs');
const path = require('path');

const results = [];
function walk(d) {
    for (const n of fs.readdirSync(d)) {
        const fp = path.join(d, n);
        const st = fs.statSync(fp);
        if (st.isDirectory()) walk(fp);
        else if (n.endsWith('.tsx') || n.endsWith('.ts') || n.endsWith('.md')) {
            try {
                const c = fs.readFileSync(fp, 'utf8');
                // look for specific double encoded strings the user mentioned:
                const hasMojibake = c.includes('Ã§') ||
                                    c.includes('Ã£') ||
                                    c.includes('Ãµ') ||
                                    c.includes('Ã‰') ||
                                    c.includes('Ã“') ||
                                    c.includes('Ã¡') ||
                                    c.includes('Ã') ||
                                    c.includes('');
					
                if (hasMojibake) results.push({ file: fp });
            } catch(e) {}
        }
    }
}
walk('src');
fs.writeFileSync('scan_res.json', JSON.stringify(results, null, 2));
