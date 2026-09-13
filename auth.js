/* CLC PERMODALAN - AUTH CLIENT
   Satu level akses: setiap pengguna yang login mendapat akses penuh. */
const CLC_AUTH_API_URL = "https://script.google.com/macros/s/AKfycbwBGvZdnWIfwNjpevh9WLSPtfD5ho_TqOYm9z2xFwE5SdKP_egi1INIkRevY3yFLNxi/exec";
const CLC_TOKEN_KEY = "CLC_ABSENSI_TOKEN";
const CLC_USER_KEY = "CLC_ABSENSI_USER";

window.CLC_AUTH_TOKEN = localStorage.getItem(CLC_TOKEN_KEY) || "";

function clcJsonp(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const cb = "clcAuth_" + Date.now() + "_" + Math.floor(Math.random()*100000);
    const script = document.createElement("script");
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Server tidak dapat dihubungi."));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      script.remove();
      try { delete window[cb]; } catch(e) {}
    }

    window[cb] = data => {
      if (done) return;
      done = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error("Gagal menghubungi server."));
    };

    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + encodeURIComponent(cb);
    document.body.appendChild(script);
  });
}

window.CLC_AUTH_READY = (async function() {
  if (!window.CLC_AUTH_TOKEN) {
    location.replace("portal-absensi.html");
    return false;
  }

  try {
    const data = await clcJsonp(
      CLC_AUTH_API_URL + "?action=validate&token=" + encodeURIComponent(window.CLC_AUTH_TOKEN)
    );

    if (!data || !data.success) throw new Error("Sesi tidak valid");

    if (data.nama) localStorage.setItem(CLC_USER_KEY, data.nama);
    return true;
  } catch (e) {
    localStorage.removeItem(CLC_TOKEN_KEY);
    localStorage.removeItem(CLC_USER_KEY);
    window.CLC_AUTH_TOKEN = "";
    location.replace("portal-absensi.html");
    return false;
  }
})();

function clcAuthParam() {
  if (!window.CLC_AUTH_TOKEN) return "";
  return "&token=" + encodeURIComponent(window.CLC_AUTH_TOKEN);
}

function clcLogout() {
  const token = localStorage.getItem(CLC_TOKEN_KEY) || "";
  localStorage.removeItem(CLC_TOKEN_KEY);
  localStorage.removeItem(CLC_USER_KEY);
  window.CLC_AUTH_TOKEN = "";
  if (token) {
    clcJsonp(CLC_AUTH_API_URL + "?action=logout&token=" + encodeURIComponent(token)).catch(()=>{});
  }
  location.replace("portal-absensi.html");
}
