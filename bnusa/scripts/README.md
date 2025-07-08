# Bnusa Scripts Directory

This directory contains scripts for maintenance and automation tasks on the Bnusa Platform.

## Available Scripts

### check-writer-profiles.js
Checks all users with published articles and creates writer profiles for those who don't have them.

### scheduler.js
Sets up scheduled tasks for automatic maintenance. This script uses node-cron to schedule periodic tasks:

- Writer Profile Check: Daily at 2:00 AM
- Article Status Check: Daily at 3:00 AM
- Slug Validation: Weekly on Sunday at 4:00 AM
- Database Health Check: Daily at 1:00 AM

## Running the Scheduler

### Prerequisites

Ensure you have installed node-cron:

```bash
npm install node-cron
```

### Running Manually

You can run the scheduler manually with:

```bash
node scripts/scheduler.js
```

This will start the scheduler in the foreground. Use Ctrl+C to stop it.

### Running as a Service (Linux/macOS)

For production environments, you may want to run the scheduler as a service.

#### Using PM2

1. Install PM2 if you haven't already:
   ```bash
   npm install -g pm2
   ```

2. Start the scheduler with PM2:
   ```bash
   pm2 start scripts/scheduler.js --name "bnusa-scheduler"
   ```

3. Make PM2 start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

#### Using systemd (Linux)

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/bnusa-scheduler.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=Bnusa Platform Maintenance Scheduler
   After=network.target

   [Service]
   User=your-user
   WorkingDirectory=/path/to/bnusa
   ExecStart=/usr/bin/node /path/to/bnusa/scripts/scheduler.js
   Restart=always
   RestartSec=10
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=bnusa-scheduler

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable bnusa-scheduler
   sudo systemctl start bnusa-scheduler
   ```

4. Check status:
   ```bash
   sudo systemctl status bnusa-scheduler
   ```

### Running as a Service (Windows)

For Windows, you can use the following options:

#### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create a new Task
3. Set the following:
   - Name: Bnusa Scheduler
   - Run whether user is logged on or not
   - Configure for your Windows version
4. In Triggers tab, add a trigger: "At startup"
5. In Actions tab, add a new action:
   - Action: Start a program
   - Program/script: Browse to your Node.js executable (e.g., C:\Program Files\nodejs\node.exe)
   - Add arguments: full path to scheduler.js
   - Start in: full path to bnusa directory
6. In Settings tab, check "Allow task to be run on demand"
7. Click OK to save the task

#### Using NSSM (Non-Sucking Service Manager)

1. Download and install NSSM from http://nssm.cc/
2. Open Command Prompt as Administrator
3. Run:
   ```
   nssm install BnusaScheduler
   ```
4. In the GUI that appears, set:
   - Path: path to Node.js executable
   - Startup directory: path to bnusa directory
   - Arguments: scripts/scheduler.js
5. Go to the Details tab and set a description
6. Click Install service

The scheduler will now run as a Windows service and start automatically on system boot. 