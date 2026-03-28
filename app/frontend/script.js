/* script.js – PCOS Prediction System */

(function () {
  'use strict';

  const form        = document.getElementById('pcos-form');
  const submitBtn   = document.getElementById('submit-btn');
  const btnText     = submitBtn.querySelector('.btn-text');
  const btnSpinner  = submitBtn.querySelector('.btn-spinner');
  const resultSec   = document.getElementById('result-section');
  const riskBadge   = document.getElementById('risk-badge');
  const riskSub     = document.getElementById('risk-sub');
  const probValue   = document.getElementById('prob-value');
  const gaugeArc    = document.getElementById('gauge-arc');
  const recList     = document.getElementById('rec-list');
  const resetBtn    = document.getElementById('reset-btn');

  const FSH_input   = document.getElementById('FSH');
  const LH_input    = document.getElementById('LH');
  const FSHLH_input = document.getElementById('FSH_LH_ratio');
  const Waist_input = document.getElementById('Waist');
  const Hip_input   = document.getElementById('Hip');
  const WHR_input   = document.getElementById('Waist_Hip_Ratio');

  // Auto-compute derived ratios
  function recomputeRatios() {
    const fsh = parseFloat(FSH_input.value);
    const lh  = parseFloat(LH_input.value);
    if (!isNaN(fsh) && !isNaN(lh) && lh !== 0) {
      FSHLH_input.value = (fsh / lh).toFixed(3);
    }
    const w = parseFloat(Waist_input.value);
    const h = parseFloat(Hip_input.value);
    if (!isNaN(w) && !isNaN(h) && h !== 0) {
      WHR_input.value = (w / h).toFixed(3);
    }
  }

  [FSH_input, LH_input, Waist_input, Hip_input].forEach(el =>
    el.addEventListener('input', recomputeRatios)
  );

  // Circular gauge (circumference = 2π×50 ≈ 314)
  const CIRC = 314;
  function animateGauge(pct, isHigh) {
    const offset = CIRC - (pct / 100) * CIRC;
    gaugeArc.style.strokeDashoffset = offset;
    gaugeArc.classList.toggle('high', isHigh);
    gaugeArc.classList.toggle('low',  !isHigh);
  }

  function animateNumber(el, target, duration = 900) {
    const start = performance.now();
    const from  = parseInt(el.textContent, 10) || 0;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const HIGH_RECS = [
    'Consult a gynaecologist or endocrinologist for a thorough evaluation.',
    'Consider hormonal blood tests (LH, FSH, testosterone, insulin).',
    'Aim for a balanced, low-glycaemic diet and maintain a healthy weight.',
    'Engage in at least 150 min/week of moderate aerobic exercise.',
    'Monitor menstrual cycle regularity and keep a symptom journal.',
    'Discuss contraceptive or hormonal therapy options with your doctor.',
    'Reduce stress through mindfulness, yoga, or counselling.',
    'Request a pelvic ultrasound to assess ovarian morphology.',
  ];

  const LOW_RECS = [
    'Continue maintaining a healthy, balanced diet.',
    'Stay active – regular exercise supports hormonal balance.',
    'Schedule annual gynaecological check-ups.',
    'Track your menstrual cycle to detect any changes early.',
    'Manage stress and prioritise adequate sleep.',
    'If symptoms arise (irregular cycles, acne, hair changes), see a doctor.',
  ];

  function showResult(data) {
    const isHigh = data.prediction === 1;
    const prob   = data.probability;

    riskBadge.textContent = data.risk;
    riskBadge.className   = 'risk-badge ' + (isHigh ? 'high' : 'low');
    riskSub.textContent   = isHigh
      ? `The model estimates a ${prob}% probability of PCOS. Please seek medical advice.`
      : `The model estimates a ${prob}% probability of PCOS. Maintain a healthy lifestyle.`;

    animateNumber(probValue, prob, 1000);
    animateGauge(prob, isHigh);

    const recs = isHigh ? HIGH_RECS : LOW_RECS;
    recList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');

    resultSec.classList.remove('hidden');
    resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    btnText.classList.toggle('hidden', on);
    btnSpinner.classList.toggle('hidden', !on);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    recomputeRatios();

    // Collect numeric fields
    const numericFields = [
      'Age', 'BMI', 'Cycle_Length', 'Follicle_No_L', 'Follicle_No_R',
      'Avg_F_size_L', 'Avg_F_size_R', 'TSH', 'AMH', 'LH', 'FSH',
      'FSH_LH_ratio', 'Waist', 'Hip', 'Waist_Hip_Ratio',
    ];

    const binaryFields = [
      'Weight_Gain', 'Hair_Growth', 'Skin_Darkening', 'Hair_Loss',
      'Pimples', 'Fast_Food', 'Reg_Exercise',
    ];

    const payload = {};
    let valid = true;

    for (const f of numericFields) {
      const el  = document.getElementById(f);
      const val = parseFloat(el.value);
      if (isNaN(val) && !el.readOnly) {
        el.focus();
        el.style.borderColor = 'var(--danger)';
        valid = false;
        break;
      }
      el.style.borderColor = '';
      payload[f] = isNaN(val) ? 0 : val;
    }

    if (!valid) {
      alert('Please fill in all required fields.');
      return;
    }

    for (const f of binaryFields) {
      payload[f] = document.getElementById(f).checked ? 1 : 0;
    }

    setLoading(true);
    try {
      const response = await fetch('/predict', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      showResult(data);
    } catch (err) {
      alert('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    FSHLH_input.value = '';
    WHR_input.value   = '';
    resultSec.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
