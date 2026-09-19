#!/bin/bash
# 启动家族网站服务（后台常驻）
cd "$(dirname "$0")"
pkill -f "next-server" 2>/dev/null
sleep 2
nohup setsid npm start -- -p 3000 -H 0.0.0.0 > server.log 2>&1 < /dev/null &
sleep 14
echo "启动完成"
