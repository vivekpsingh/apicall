/* ===== Elements & state ===== */
const wheelCanvas = document.getElementById('wheelCanvas');
const wheelCtx = wheelCanvas.getContext('2d');

const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');

const playerNameInput = document.getElementById('playerName');
const PayUPIInput = document.getElementById('MobileNo');

const spinBtn = document.getElementById('spinBtn');

const manageBtn = document.getElementById('manageBtn');
const manageModal = document.getElementById('manageModal');
const prizeListEl = document.getElementById('prizeList');
const newPrizeInput = document.getElementById('newPrizeInput');
const addPrizeBtn = document.getElementById('addPrizeBtn');
const closeManageBtn = document.getElementById('closeManageBtn');
const savePrizeBtn = document.getElementById('savePrizeBtn');

const resultModal = document.getElementById('resultModal');
const winnerText = document.getElementById('winnerText');
const prizeText = document.getElementById('prizeText');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeResultBtn = document.getElementById('closeResultBtn');

const clickSound = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
const winSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');

let prizes = ["Rs.0 Gift Card","Rs.50 Gift Card","Rs.100 Gift Card","Better Luck Next Time","Rs.1000 Gift Card","Rs.1500 Gift Card"];
const colors = ["#808000","#00FF00","#FFA500","#FF00FF","#00FFFF","#FFC0CB","#FBE9E7","#800000"];

let displaySize = 460;
let dpr = Math.max(window.devicePixelRatio || 1, 1);
let center = {x:0,y:0};
let radius = 0;
let currentRotation = 0; // radians
let spinning = false;
let lastSliceSound = -1;

/* ===== Resize (set CSS size + backing store for DPR) ===== */
function resizeAll(){
  dpr = Math.max(window.devicePixelRatio || 1, 1);
  const shown = Math.min(window.innerWidth * 0.9, 520);
  displaySize = Math.round(shown);

  // wheel canvas (use CSS px coordinates)
  wheelCanvas.style.width = displaySize + 'px';
  wheelCanvas.style.height = displaySize + 'px';
  wheelCanvas.width = displaySize * dpr;
  wheelCanvas.height = displaySize * dpr;
  wheelCtx.setTransform(dpr,0,0,dpr,0,0);

  center.x = displaySize / 2;
  center.y = displaySize / 2;
  radius = (displaySize / 2) - 18;

  // confetti canvas fullscreen
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCanvas.width = Math.round(window.innerWidth * dpr);
  confettiCanvas.height = Math.round(window.innerHeight * dpr);
  confettiCtx.setTransform(dpr,0,0,dpr,0,0);

  // redraw
  drawWheel(currentRotation);
}
window.addEventListener('resize', resizeAll);
resizeAll();

/* ===== draw wheel (rotation in radians) and optional highlighted slice ===== */
function drawWheel(rotationRad = 0, highlightIndex = null, highlightAlpha = 0){
  const ctx = wheelCtx;
  ctx.clearRect(0,0,displaySize,displaySize);

  const slice = (2 * Math.PI) / prizes.length;

  // draw wheel rotated
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotationRad);
  ctx.translate(-center.x, -center.y);

  for(let i=0;i<prizes.length;i++){
    const start = i * slice;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, start, start + slice);
    ctx.closePath();
    ctx.fill();

    // label
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(start + slice/2);
    ctx.fillStyle = "#2b2b2b";
    ctx.font = `${Math.max(12, displaySize/24)}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(prizes[i], radius - 12, 6);
    ctx.restore();
  }

  // highlight overlay in wheel's rotated coordinate system
  if(highlightIndex !== null && highlightAlpha > 0){
    const start = highlightIndex * slice;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,230,100,${Math.min(1, highlightAlpha)})`;
    ctx.fill();
  }

  ctx.restore();

  // fixed pointer on top
  drawPointer();
}

function drawPointer(){
  const ctx = wheelCtx;
  ctx.save();
  const pointerHalf = Math.max(8, displaySize * 0.03);
  const y = center.y - radius - 4;
  ctx.beginPath();
  ctx.moveTo(center.x - pointerHalf, y);
  ctx.lineTo(center.x + pointerHalf, y);
  ctx.lineTo(center.x, y + Math.max(18, displaySize * 0.06));
  ctx.closePath();
  ctx.fillStyle = "#666";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.restore();
}

/* ===== convert rotation -> index (slice under top pointer) ===== */
function rotationToIndex(rotationRad){
  const rotDeg = ((rotationRad * 180 / Math.PI) % 360 + 360) % 360;
  const pointerDeg = (270 - rotDeg + 360) % 360; // top = 270 deg
  const sliceDeg = 360 / prizes.length;
  let idx = Math.floor(pointerDeg / sliceDeg);
  idx = ((idx % prizes.length) + prizes.length) % prizes.length;
  return idx;
}

/* ===== spin logic (choose target index, animate) ===== */

function spinWheel(usingPlayerName){
  if(spinning) return;
  const playerName = (usingPlayerName !== undefined) ? usingPlayerName : (playerNameInput.value || '').trim();
  if(!playerName){
    alert('Please enter your name first.');
    return;
  }

const PayUPIInput = (usingPlayerName !== undefined) ? usingPlayerName : (MobileNo.value || '').trim();
if(!PayUPIInput){
    alert('Please enter your UPI ID');
    return;
  }



  spinning = true;
  spinBtn.disabled = true;
  manageBtn.disabled = true;
  // hide name while spinning
  playerNameInput.style.visibility = 'hidden';

  // pick a random index
  const chosenIndex = Math.floor(Math.random() * prizes.length);

  // compute target rotation so chosenIndex center ends under top pointer
  const sliceDeg = 360 / prizes.length;
  const desiredPointerDeg = (chosenIndex + 0.5) * sliceDeg;
  const desiredWheelDegNormalized = (270 - desiredPointerDeg + 360) % 360;

  const currentDeg = ((currentRotation * 180 / Math.PI) % 360 + 360) % 360;
  let deltaDeg = (desiredWheelDegNormalized - currentDeg + 360) % 360;

  const extraSpins = 4 + Math.floor(Math.random() * 3); // 4..6
  const totalDeg = deltaDeg + extraSpins * 360;
  const targetRotation = currentRotation + (totalDeg * Math.PI / 180);

  const duration = 4200 + Math.floor(Math.random() * 800);
  const startRot = currentRotation;
  let startTime = null;
  lastSliceSound = -1;

  function step(ts){
    if(!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const nowRot = startRot + (targetRotation - startRot) * ease;

    drawWheel(nowRot);

    // click sound when we move across slices
    const idx = rotationToIndex(nowRot);
    if(idx !== lastSliceSound){
      lastSliceSound = idx;
      try{ clickSound.currentTime = 0; clickSound.play().catch(()=>{}); }catch(e){}
    }

    if(t < 1){
      requestAnimationFrame(step);
      return;
    }

    // finished spinning
    currentRotation = targetRotation % (2 * Math.PI);
    drawWheel(currentRotation);

    const winningIndex = rotationToIndex(currentRotation);

    // pulse the winning slice then show modal
    pulseHighlight(winningIndex, 3, 700, () => {
      showResultModal(playerName, prizes[winningIndex]);
      // keep controls locked until modal closed
    });
  }

  requestAnimationFrame(step);
}

/* ===== smooth pulse highlight (alpha rises/falls) ===== */
function pulseHighlight(index, pulses = 3, pulseDuration = 700, callback){
  const total = pulses * pulseDuration;
  const start = performance.now();
  function frame(now){
    const elapsed = now - start;
    if(elapsed >= total){
      drawWheel(currentRotation, null, 0);
      callback && callback();
      return;
    }
    const pulseProgress = (elapsed % pulseDuration) / pulseDuration; // 0..1
    const alpha = Math.sin(pulseProgress * Math.PI); // smooth 0..1..0
    drawWheel(currentRotation, index, alpha * 0.95);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ===== show result modal, confetti, sound ===== */
function showResultModal(player, prize){
  winnerText.textContent = `${player}, You Won!`;
  prizeText.textContent = `🎁 Prize: ${prize}`;
var sr=prizeText.textContent;
if(sr=='🎁 Prize: Better Luck Next Time' || sr=='🎁 Prize: Rs.0 Gift Card')
{
alert(prizeText.textContent); 
playAgainBtn.disabled = true;
}
else

{
playAgainBtn.disabled = false;

}
//

  // change background theme
  changeBackground();
  resultModal.classList.add('active');
  startConfetti();
  try{ winSound.currentTime = 0; winSound.play().catch(()=>{}); }catch(e){}
}

function closeResult(){


  resultModal.classList.remove('active');
  fadeOutConfetti();
  spinBtn.disabled = false;
  manageBtn.disabled = false;
  playerNameInput.style.visibility = ''; // restore visibility
  spinning = false;
}

function openPopup(url, width, height) {
    // Calculate the center position of the screen
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);

    // Define the window features
    // No spaces allowed in the features string

  

    const features = `width=${width},height=${height},top=${top},left=${left},
                      menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes,dependent=no`;



    
const input = document.createElement('input');
input.type = 'text';
input.id = 'myInput';
input.placeholder = 'Enter text here';
document.body.appendChild(input);
//features.appendChild(input);

//features.appendChild(input);

    //features.document.body.appendChild(div);
    // Open the new window and get a reference to it
    const newWindow = window.open(url, 'popupWindowName', features);

    // Optional: bring the new window into focus
    if (newWindow) {
        newWindow.focus();
    }
    
    // Prevent the default link action
    return false; 
}


/* Play Again behavior */
playAgainBtn.addEventListener('click', ()=>{
 /* const nameFromInput = (playerNameInput.value || '').trim();
  const shown = winnerText.textContent.replace(/, You Won!$/,'').trim();
  const player = nameFromInput || shown || 'Player';
  // close modal and spin again
  resultModal.classList.remove('active');
  fadeOutConfetti();
  setTimeout(()=>{
    spinning = false;
    spinBtn.disabled = false;
    manageBtn.disabled = false;
    spinWheel(player);
  }, 160);*/

var url = "https://www.upi.me/pay?pa=9555527395@indie&am=10&tn=Pay Rs. 10 for redeem your earned cash";
openPopup(url,600,600);
});
closeResultBtn.addEventListener('click', closeResult);

/* ===== change background themes ===== */
const themes = [
  "linear-gradient(-45deg,#ff9a9e,#fad0c4,#a1c4fd,#c2e9fb)",
  "linear-gradient(-45deg,#ffecd2,#fcb69f,#ff9a9e,#fecfef)",
  "linear-gradient(-45deg,#84fab0,#8fd3f4,#cfd9df,#e2ebf0)",
  "linear-gradient(-45deg,#f6d365,#fda085,#fbc2eb,#a18cd1)"
];
function changeBackground(){
  const t = themes[Math.floor(Math.random()*themes.length)];
  document.body.style.background = t;
  document.body.style.backgroundSize = "400% 400%";
  document.body.style.animation = "gradientBG 15s ease infinite";
}

/* ===== Manage prizes modal logic ===== */
function openManage(){ populatePrizeList(); manageModal.classList.add('active'); }
function closeManage(){ manageModal.classList.remove('active'); }
manageBtn.addEventListener('click', openManage);
closeManageBtn.addEventListener('click', closeManage);

function populatePrizeList(){
  prizeListEl.innerHTML = '';
  prizes.forEach((p,i) => {
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.value = p;
    input.addEventListener('input', ()=> { prizes[i] = input.value; });
    const rem = document.createElement('button');
    rem.textContent = 'Remove';
    rem.style.background = '#ef5350';
    rem.style.color = '#fff';
    rem.style.border = '0';
    rem.style.padding = '6px 8px';
    rem.style.borderRadius = '6px';
    rem.style.cursor = 'pointer';
    rem.addEventListener('click', ()=>{
      prizes.splice(i,1);
      populatePrizeList();
      drawWheel(currentRotation);
    });
    li.appendChild(input);
    li.appendChild(rem);
    prizeListEl.appendChild(li);
  });
}

addPrizeBtn.addEventListener('click', ()=>{
  const v = (newPrizeInput.value || '').trim();
  if(!v) return;
  prizes.push(v);
  newPrizeInput.value = '';
  populatePrizeList();
  drawWheel(currentRotation);
});
savePrizeBtn.addEventListener('click', ()=>{
  prizes = prizes.map(p => (typeof p === 'string' ? p.trim() : '')).filter(Boolean);
  if(prizes.length < 2){ alert('Please have at least 2 prizes.'); return; }
  populatePrizeList();
  drawWheel(currentRotation);
  closeManage();
});

/* ===== Confetti system (fullscreen) ===== */
let confettiParticles = [];
let confettiFrameId = null;
let confettiOpacity = 0;

function startConfetti(){
  confettiParticles = [];
  const w = confettiCanvas.width / dpr;
  const h = confettiCanvas.height / dpr;
  for(let i=0;i<220;i++){
    confettiParticles.push({
      x: Math.random()*w,
      y: Math.random()*h - h,
      r: Math.random()*6 + 4,
      d: Math.random()*100,
      color: `hsl(${Math.random()*360},90%,55%)`,
      tilt: Math.random()*15 - 10,
      tiltAngle: 0,
      tiltAccel: Math.random()*0.07 + 0.01
    });
  }
  confettiOpacity = 0;
  if(confettiFrameId) cancelAnimationFrame(confettiFrameId);
  function fadeIn(){
    confettiOpacity += 0.06;
    if(confettiOpacity >= 1){
      confettiOpacity = 1;
      confettiFrameId = requestAnimationFrame(()=>updateConfetti(confettiOpacity));
    } else {
      updateConfetti(confettiOpacity);
      confettiFrameId = requestAnimationFrame(fadeIn);
    }
  }
  fadeIn();
}

function updateConfetti(opacity = 1){
  const ctx = confettiCtx;
  const w = confettiCanvas.width / dpr;
  const h = confettiCanvas.height / dpr;
  ctx.clearRect(0,0,w,h);
  confettiParticles.forEach(p=>{
    p.tiltAngle += p.tiltAccel;
    p.y += (Math.cos(p.d) + 3 + p.r)/2;
    p.x += Math.sin(p.d);
    p.tilt = Math.sin(p.tiltAngle) * 12;
    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color.replace('hsl','hsla').replace(')',`, ${opacity})`);
    ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
    ctx.stroke();
    if(p.y > h + 30){
      p.y = -10 - Math.random() * h * 0.2;
      p.x = Math.random() * w;
    }
  });
  confettiFrameId = requestAnimationFrame(()=>updateConfetti(opacity));
}

function fadeOutConfetti(){
  let op = confettiOpacity || 1;
  function fade(){
    op -= 0.06;
    if(op <= 0){
      if(confettiFrameId){ cancelAnimationFrame(confettiFrameId); confettiFrameId = null; }
      confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
      confettiParticles = [];
      confettiOpacity = 0;
      return;
    }
    updateConfetti(op);
    requestAnimationFrame(fade);
  }
  fade();
}

/* ===== helper to resize confetti backing store ===== */
function resizeConfettiFull(){
  dpr = Math.max(window.devicePixelRatio || 1, 1);
  confettiCanvas.width = Math.round(window.innerWidth * dpr);
  confettiCanvas.height = Math.round(window.innerHeight * dpr);
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', ()=>{
  resizeAll();
  resizeConfettiFull();
});
resizeConfettiFull();

/* ===== events & init ===== */
spinBtn.addEventListener('click', ()=> spinWheel());
populatePrizeList();
drawWheel(currentRotation);

/* Provide a sane resizeAll in case called above */
function resizeAll(){
  resizeAll = null; // prevent recursion
  resizeAll = function(){ resizeAll = function(){}; }; // dummy replacement
  // Call the real function body:
  dpr = Math.max(window.devicePixelRatio || 1, 1);
  const shown = Math.min(window.innerWidth * 0.9, 520);
  displaySize = Math.round(shown);
  wheelCanvas.style.width = displaySize + 'px';
  wheelCanvas.style.height = displaySize + 'px';
  wheelCanvas.width = displaySize * dpr;
  wheelCanvas.height = displaySize * dpr;
  wheelCtx.setTransform(dpr,0,0,dpr,0,0);
  center.x = displaySize/2; center.y = displaySize/2; radius = (displaySize/2)-18;
  drawWheel(currentRotation);
}
/* replace placeholder with proper function */
resizeAll = function(){
  dpr = Math.max(window.devicePixelRatio || 1, 1);
  const shown = Math.min(window.innerWidth * 0.9, 520);
  displaySize = Math.round(shown);
  wheelCanvas.style.width = displaySize + 'px';
  wheelCanvas.style.height = displaySize + 'px';
  wheelCanvas.width = displaySize * dpr;
  wheelCanvas.height = displaySize * dpr;
  wheelCtx.setTransform(dpr,0,0,dpr,0,0);
  center.x = displaySize/2; center.y = displaySize/2; radius = (displaySize/2)-18;
  drawWheel(currentRotation);
};
window.addEventListener('resize', resizeAll);

// ensure initial sizes are correct:
resizeAll();
resizeConfettiFull();
