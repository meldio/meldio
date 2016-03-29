
export function closeWith(res, data) {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login</title>
      </head>
      <body>
        <script src="/static/winchan.js"></script>
        <script>
          WinChan.onOpen(function(origin, args, cb) {
            cb(${JSON.stringify(data)});
          });
        </script>
      </body>
    </html>
  `);
  res.end();
}
