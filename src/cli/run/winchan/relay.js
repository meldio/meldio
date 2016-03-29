export function relay(req, res) {
  res.send(`
    <!DOCTYPE html>
    <html>
      <script>
        function doPost(msg, origin) {
          window.parent.postMessage(msg, origin);
        }
      </script>
    </html>
  `);
  res.end();
}
