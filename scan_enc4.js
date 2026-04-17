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
                // check explicitly for mojibake pairs that appear together in double-encoded text
                const pairs = ['Ã§', 'Ã£', 'Ãµ', 'Ã‰', 'Ã“', 'Ã¡', 'Ã©', 'Ã­', 'Ãº', 'TÃ‰', 'ExercÃ', 'instruÃ'];
                const found = pairs.filter(p => c.includes(p));
                
                if (found.length > 0) {
                    results.push({ file: fp, matches: found });
                }
            } catch(e) {}
        }
    }
}
walk('src');
fs.writeFileSync('scan_res4.json', JSON.stringify(results, null, 2));
