(() => {
  const host = window.location.hostname;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(host);
  const isRenderHost = host.endsWith(".onrender.com");

  if (window.BACK2YOU_API_BASE_URL) {
    return;
  }

  if (isLocalHost) {
    window.BACK2YOU_API_BASE_URL = "http://localhost:5000/api";
    return;
  }

  if (isRenderHost) {
    window.BACK2YOU_API_BASE_URL = "/api";
  }
})();
