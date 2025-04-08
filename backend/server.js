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

            // ===== CPU PARSING =====
            const cpuLine = lines.find(line => line.includes('%Cpu(s):'));
            if (!cpuLine) {
                reject(new Error('CPU line not found'));
                return;
            }

            // Extract idle percentage (more robust regex)
            const idleMatch = cpuLine.match(/(\d+\.?\d*)\s*id(?:le)?\,?/i);
            if (!idleMatch) {
                reject(new Error('Idle CPU percentage not found'));
                return;
            }
            const idle = parseFloat(idleMatch[1]);
            const cpuUsage = (100 - idle).toFixed(2);

            // ===== MEMORY PARSING =====
            const memLine = lines.find(line => line.includes('Mem:') || line.includes('Mem '));
            if (!memLine) {
                reject(new Error('Memory line not found'));
                return;
            }

            // NEW: Universal memory parsing
            const memData = memLine.replace(/,/g, '').split(/\s+/).filter(Boolean);
            
            // Find indices of keywords
            const totalIndex = memData.findIndex(v => v === 'total');
            const usedIndex = memData.findIndex(v => v === 'used');
            const freeIndex = memData.findIndex(v => v === 'free');

            if (totalIndex === -1 || usedIndex === -1 || freeIndex === -1) {
                reject(new Error('Memory metrics not found in expected format'));
                return;
            }

            // Extract values (position -1 because value comes before label)
            const total = parseFloat(memData[totalIndex - 1]);
            const used = parseFloat(memData[usedIndex - 1]);
            const free = parseFloat(memData[freeIndex - 1]);

            if (isNaN(total) || isNaN(used) || isNaN(free)) {
                reject(new Error('Failed to parse memory values'));
                return;
            }

            // Detect unit (KiB/MiB/GiB)
            let unit = 'KiB'; // default
            if (memLine.includes('MiB')) unit = 'MiB';
            else if (memLine.includes('GiB')) unit = 'GiB';

            // Convert to MiB
            let totalMiB, usedMiB, freeMiB;
            switch (unit) {
                case 'KiB':
                    totalMiB = total / 1024;
                    usedMiB = used / 1024;
                    freeMiB = free / 1024;
                    break;
                case 'MiB':
                    totalMiB = total;
                    usedMiB = used;
                    freeMiB = free;
                    break;
                case 'GiB':
                    totalMiB = total * 1024;
                    usedMiB = used * 1024;
                    freeMiB = free * 1024;
                    break;
            }

            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: parseFloat(cpuUsage),
                },
                memory: {
                    total: Math.round(totalMiB),
                    used: Math.round(usedMiB),
                    free: Math.round(freeMiB),
                    percentUsed: ((usedMiB / totalMiB) * 100).toFixed(2),
                    unit: 'MiB' // Standardized output unit
                },
            };

            fs.writeFile('metrics.json', JSON.stringify(metrics, null, 2))
                .then(() => resolve(metrics))
                .catch(reject);
        });
    });
}

// ===== ROUTES =====
app.get('/metrics', async (req, res) => {
    try {
        const metrics = await collectSystemMetrics();
        res.status(200).json({ status: 'success', data: metrics });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            suggestion: 'Ensure Linux system has top command available'
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'operational', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}/metrics`);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
    process.exit(1);
});