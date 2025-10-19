module.exports = {
    apps: [{
        name: 'arch2-discord-bot',
        script: 'ultimate-xyian-bot.js',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        watch: false,
        max_memory_restart: '1G',
        restart_delay: 4000,
        max_restarts: 10,
        min_uptime: '10s'
    }]
};
