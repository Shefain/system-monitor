const express = require('express');
const { exec } = require('child_process');
const fs = require('fs/promises');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

async function collectSystemMetrics() {
    return new Promise((resolve, reject) => {
        exec('top -bn1', (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            console.log('Raw top output:', stdout); // Debug

            const lines = stdout.split('\n');

            // Parse CPU metrics
            const cpuLine = lines.find(line => line.includes('%Cpu(s):'));
            if (!cpuLine) {
                reject(new Error('CPU line not found'));
                return;
            }

            const idleMatch = cpuLine.match(/(\d+\.?\d*)\s+id/);
            if (!idleMatch) {
                reject(new Error('Idle CPU percentage not found'));
                return;
            }
            const idle = parseFloat(idleMatch[1]);
            const cpuUsage = (100 - idle).toFixed(2);

            // Parse Memory metrics
            const memLine = lines.find(line => line.includes('Mem'));
            if (!memLine) {
                reject(new Error('Memory line not found'));
                return;
            }

            const unitMatch = memLine.match(/(KiB|MiB|GiB)\s+Mem/);
            const unit = unitMatch ? unitMatch[1] : 'KiB';

            const parts = memLine.split(',').map(part => part.trim());
            let total, used, free;

            parts.forEach(part => {
                if (part.includes('total')) {
                    const match = part.match(/(\d+\.?\d*)\s+total/);
                    if (match) total = parseFloat(match[1]);
                } else if (part.includes('used')) {
                    const match = part.match(/(\d+\.?\d*)\s+used/);
                    if (match) used = parseFloat(match[1]);
                } else if (part.includes('free')) {
                    const match = part.match(/(\d+\.?\d*)\s+free/);
                    if (match) free = parseFloat(match[1]);
                }
            });

            if (typeof total === 'undefined' || typeof used === 'undefined' || typeof free === 'undefined') {
                reject(new Error('Could not parse memory values'));
                return;
            }

            // Convert to MiB based on detected unit
            switch (unit) {
                case 'KiB':
                    total /= 1024;
                    used /= 1024;
                    free /= 1024;
                    break;
                case 'MiB':
                    // Already in MiB, no conversion needed
                    break;
                case 'GiB':
                    total *= 1024;
                    used *= 1024;
                    free *= 1024;
                    break;
                default:
                    reject(new Error(`Unsupported memory unit: ${unit}`));
                    return;
            }

            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: parseFloat(cpuUsage),
                },
                memory: {
                    total: Math.round(total),
                    used: Math.round(used),
                    free: Math.round(free),
                    percentUsed: ((used / total) * 100).toFixed(2),
                },
            };

            // Write metrics to file and resolve
            fs.writeFile('metrics.json', JSON.stringify(metrics, null, 2))
                .then(() => resolve(metrics))
                .catch(reject);
        });
    });
}

app.get('/metrics', async (req, res) => {
    try {
        const metrics = await collectSystemMetrics();
        res.status(200).json({ status: 'success', data: metrics });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'operational', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`Backend server operational on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});