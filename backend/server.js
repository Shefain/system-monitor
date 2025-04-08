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
        exec('top -bn1', async (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            const lines = stdout.split('\n');
            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: parseFloat(lines[2].match(/%Cpu\(s\):[\s]*([\d.]+)/)?.[1] || 0),
                },
                memory: {
                    total: parseInt(lines[3].match(/Mem\s*:\s*([\d]+)/)?.[1] || 0) / 1024, // Convert kB to MB
                    used: parseInt(lines[3].match(/used,\s*([\d]+)/)?.[1] || 0) / 1024,   // Convert kB to MB
                    free: parseInt(lines[3].match(/free,\s*([\d]+)/)?.[1] || 0) / 1024,   // Convert kB to MB
                    percentUsed: 0,
                },
            };

            // Calculate memory usage percentage (unchanged, based on raw values)
            if (metrics.memory.total > 0) {
                metrics.memory.percentUsed = ((metrics.memory.used / metrics.memory.total) * 100).toFixed(2);
            }

            try {
                await fs.writeFile('metrics.json', JSON.stringify(metrics, null, 2));
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
        res.status(200).json({
            status: 'success',
            data: metrics,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to collect system metrics',
            error: error.message,
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'operational',
        uptime: process.uptime(),
    });
});

app.listen(PORT, () => {
    console.log(`Backend server operational on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});