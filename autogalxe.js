(function () {
  if (window.taskScriptAlreadyRun) {
    console.warn("⚠️ Script sudah pernah dijalankan. Abort.");
    return;
  }
  window.taskScriptAlreadyRun = true;

  let isRunningTask = false;
  let exitDialogObserver = null;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function refreshPage() {
    console.log("🔄 Melakukan refresh halaman...");
    location.reload();
  }

  async function clickUnverifiedTasks() {
    const taskTexts = ["Like @", "Retweet", "Visit", "Have", "Join", "Follow @", "Tweet Bullish"];

    const containers = Array.from(document.querySelectorAll("div[data-state='closed']"))
      .filter(container => {
        const taskText = container.textContent;
        const matchText = taskTexts.some(text => taskText.includes(text));
        const isVerified = container.querySelector("svg.text-success") || container.querySelector("div.bg-success");
        const hasClickable = container.querySelector(".cursor-pointer");
        return matchText && !isVerified && hasClickable;
      });

    console.log(`🔍 Ditemukan ${containers.length} task yang belum selesai.`);

    for (let i = 0; i < containers.length; i++) {
      if (!isRunningTask) break;

      const container = containers[i];
      const clickable = container.querySelector(".cursor-pointer");

      console.log(`➡️ Memproses task #${i + 1}...`);

      if (!clickable) {
        continue;
      }

      const originalWindowOpen = window.open;
      window.open = () => null;

      clickable.scrollIntoView({ behavior: "smooth", block: "center" });
      clickable.click();
      console.log("✅ Klik task");

      const delay = 2500 + Math.random() * 2500;
      const delaySec = Math.round(delay / 1000);
      console.log(`⏳ Tunggu ${delaySec} detik sebelum lanjut...`);
      await sleep(delay);

      if (!isRunningTask) {
        console.warn("⛔ Proses task dihentikan.");
        break;
      }

      window.open = originalWindowOpen;
    }

    console.log("🎉 Semua task yang belum selesai & valid sudah diproses.");
    isRunningTask = false;

    refreshPage();
  }

  function stopAll() {
    isRunningTask = false;
    if (exitDialogObserver) {
      exitDialogObserver.disconnect();
      exitDialogObserver = null;
    }
    console.log("🛑 Semua proses dihentikan oleh pengguna.");
    refreshPage();
  }

  function observeCaptcha() {
    let alreadyStopped = false;

    function isCaptchaVisible() {
      const geetestBox = document.querySelector(".geetest_box");
      if (!geetestBox) return false;

      const style = window.getComputedStyle(geetestBox);
      return (
        geetestBox.offsetParent !== null &&
        geetestBox.offsetHeight > 100 &&
        geetestBox.offsetWidth > 100 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    }

    const intervalId = setInterval(() => {
      if (!isRunningTask || alreadyStopped) {
        clearInterval(intervalId);
        return;
      }

      if (isCaptchaVisible()) {
        console.warn("🛑 CAPTCHA terdeteksi! Task dihentikan.");
        isRunningTask = false;
        alreadyStopped = true;
        clearInterval(intervalId);
        alert("⚠️ CAPTCHA terdeteksi! Proses otomatis dihentikan.");
      }
    }, 800);
  }

  function autoCloseExitDialog() {
    exitDialogObserver = new MutationObserver(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      const continueDiv = dialog?.querySelector('div.cursor-pointer.text-center');

      if (dialog && continueDiv) {
        continueDiv.click();
      }
    });

    exitDialogObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function createControlPanel() {
    const panel = document.createElement("div");
    panel.style.position = "fixed";
    panel.style.top = "100px";
    panel.style.right = "20px";
    panel.style.backgroundColor = "#000";
    panel.style.border = "1px solid #ccc";
    panel.style.padding = "10px";
    panel.style.zIndex = "9999";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
    panel.innerHTML = `
      <button id="startTask" style="margin: 5px;">▶️ Start</button>
      <button id="stopAll" style="margin: 5px;">🛑 Stop</button>
    `;
    document.body.appendChild(panel);

    document.getElementById("startTask").addEventListener("click", async () => {
      if (isRunningTask) {
        console.log("⚠️ Task sedang berjalan.");
        return;
      }
      isRunningTask = true;
      console.log("🚀 Memulai task...");
      observeCaptcha();
      autoCloseExitDialog();
      await clickUnverifiedTasks();
    });

    document.getElementById("stopAll").addEventListener("click", stopAll);
  }

  createControlPanel();
})();
