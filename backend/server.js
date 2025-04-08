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
            let memLine = lines.find(line => line.includes('Mem'));
            if (!memLine) {
                reject(new Error('Memory line not found'));
                return;
            }

            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: parseFloat(lines[2].match(/%Cpu\(s\):[\s]*([\d.]+)/)?.[1] || 0),
                },
                memory: {
                    total: 0,
                    used: 0,
                    free: 0,
                    percentUsed: 0,
                },
            };

            const totalMatch = memLine.match(/Mem\s*:\s*([\d]+)(?:k)?\s+total/);
            const usedMatch = memLine.match(/used,\s*([\d]+)(?:k)?\s+/);
            const freeMatch = memLine.match(/free,\s*([\d]+)(?:k)?\s*/);

            if (totalMatch && usedMatch && freeMatch) {
                metrics.memory.total = Math.round(parseInt(totalMatch[1]) / 1024);
                metrics.memory.used = Math.round(parseInt(usedMatch[1]) / 1024);
                metrics.memory.free = Math.round(parseInt(freeMatch[1]) / 1024);
            }

            if (metrics.memory.total > 0) {
                metrics.memory.percentUsed = ((metrics.memory.used / metrics.memory.total) * 100).toFixed(2);
            }

            try {
                fs.writeFile('metrics.json', JSON.stringify(metrics, null, 2));
                resolve(metrics);
            } catch (writeError) {
                reject(writeError);
            }
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