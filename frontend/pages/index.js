import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const NUMERIC_FIELDS = [
  { name: 'Age',           label: 'Age',                  unit: 'years',   min: 10,  max: 70,  step: 1,     placeholder: '28'   },
  { name: 'BMI',           label: 'BMI',                  unit: 'kg/m²',   min: 10,  max: 70,  step: 0.1,   placeholder: '23.5' },
  { name: 'Cycle_Length',  label: 'Cycle Length',         unit: 'days',    min: 15,  max: 120, step: 1,     placeholder: '30'   },
  { name: 'Follicle_No_L', label: 'Follicles — Left',    unit: 'count',   min: 0,   max: 50,  step: 1,     placeholder: '8'    },
  { name: 'Follicle_No_R', label: 'Follicles — Right',   unit: 'count',   min: 0,   max: 50,  step: 1,     placeholder: '9'    },
  { name: 'Avg_F_size_L',  label: 'Avg Follicle Size L', unit: 'mm',      min: 0,   max: 50,  step: 0.1,   placeholder: '14.0' },
  { name: 'Avg_F_size_R',  label: 'Avg Follicle Size R', unit: 'mm',      min: 0,   max: 50,  step: 0.1,   placeholder: '13.5' },
  { name: 'TSH',           label: 'TSH',                  unit: 'mIU/L',   min: 0,   max: 30,  step: 0.01,  placeholder: '2.5'  },
  { name: 'AMH',           label: 'AMH',                  unit: 'ng/mL',   min: 0,   max: 40,  step: 0.01,  placeholder: '4.2'  },
  { name: 'LH',            label: 'LH',                   unit: 'mIU/mL',  min: 0,   max: 80,  step: 0.01,  placeholder: '8.0'  },
  { name: 'FSH',           label: 'FSH',                  unit: 'mIU/mL',  min: 0,   max: 80,  step: 0.01,  placeholder: '6.5'  },
  { name: 'FSH_LH_ratio',  label: 'FSH/LH Ratio',        unit: '',        min: 0,   max: 50,  step: 0.001, placeholder: 'auto-computed', readonly: true },
  { name: 'Waist',         label: 'Waist',                unit: 'cm',      min: 30,  max: 200, step: 0.1,   placeholder: '80'   },
  { name: 'Hip',           label: 'Hip',                  unit: 'cm',      min: 30,  max: 220, step: 0.1,   placeholder: '95'   },
  { name: 'Waist_Hip_Ratio', label: 'Waist-to-Hip Ratio', unit: '',       min: 0,   max: 5,   step: 0.001, placeholder: 'auto-computed', readonly: true },
];

const BINARY_FIELDS = [
  { name: 'Weight_Gain',    label: 'Weight Gain'        },
  { name: 'Hair_Growth',    label: 'Excess Hair Growth' },
  { name: 'Skin_Darkening', label: 'Skin Darkening'     },
  { name: 'Hair_Loss',      label: 'Hair Loss'          },
  { name: 'Pimples',        label: 'Pimples / Acne'     },
  { name: 'Fast_Food',      label: 'Regular Fast Food'  },
  { name: 'Reg_Exercise',   label: 'Regular Exercise'   },
];

const HIGH_RECS = [
  'Consult a gynecologist or endocrinologist for a thorough evaluation.',
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
  'Stay active — regular exercise supports hormonal balance.',
  'Schedule annual gynaecological check-ups.',
  'Track your menstrual cycle to detect any changes early.',
  'Manage stress and prioritise adequate sleep.',
  'If symptoms arise (irregular cycles, acne, hair changes), see a doctor.',
];

const INITIAL_FORM = {
  ...Object.fromEntries(NUMERIC_FIELDS.map((f) => [f.name, ''])),
  ...Object.fromEntries(BINARY_FIELDS.map((f) => [f.name, false])),
};

function AnimatedValue({ target, duration }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf;
    let startTime;
    const from = 0;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return <>{value}</>;
}

AnimatedValue.defaultProps = { duration: 1000 };

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      setForm((prev) => {
        const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };

        const fsh = parseFloat(name === 'FSH' ? value : prev.FSH);
        const lh = parseFloat(name === 'LH' ? value : prev.LH);
        if (!isNaN(fsh) && !isNaN(lh) && lh !== 0) {
          updated.FSH_LH_ratio = (fsh / lh).toFixed(3);
        }

        const waist = parseFloat(name === 'Waist' ? value : prev.Waist);
        const hip = parseFloat(name === 'Hip' ? value : prev.Hip);
        if (!isNaN(waist) && !isNaN(hip) && hip !== 0) {
          updated.Waist_Hip_Ratio = (waist / hip).toFixed(3);
        }

        return updated;
      });

      if (fieldErrors[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: false }));
      }
    },
    [fieldErrors],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const newErrors = {};
    for (const field of NUMERIC_FIELDS) {
      if (field.readonly) continue;
      if (form[field.name] === '' || isNaN(parseFloat(form[field.name]))) {
        newErrors[field.name] = true;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setSubmitError('Please fill in all required fields before submitting.');
      return;
    }

    const payload = {};
    for (const field of NUMERIC_FIELDS) {
      payload[field.name] = parseFloat(form[field.name]) || 0;
    }
    for (const field of BINARY_FIELDS) {
      payload[field.name] = form[field.name] ? 1 : 0;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setSubmitError(err.message || 'Prediction failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setFieldErrors({});
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHigh = result && result.prediction === 1;
  const gaugeDeg = result ? (result.probability / 100) * 360 : 0;

  return (
    <>
      <Head>
        <title>PCOS Risk Assessment</title>
        <meta name="description" content="AI-powered polycystic ovary syndrome risk screening tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        {/* ===== HEADER ===== */}
        <header className="header">
          <div className="header-inner">
            <h1 className="header-title">PCOS Risk Assessment</h1>
            <p className="header-sub">
              AI-powered polycystic ovary syndrome risk screening
            </p>
          </div>
        </header>

        <main className="main">
          {/* ===== DISCLAIMER ===== */}
          <div className="disclaimer">
            <strong>Medical Disclaimer:</strong> This tool is for informational
            purposes only and does not constitute medical advice. Always consult
            a qualified healthcare provider.
          </div>

          {/* ===== FORM CARD ===== */}
          <section className="card">
            <form onSubmit={handleSubmit} noValidate>
              {/* Clinical Measurements */}
              <div className="fieldset-wrap">
                <p className="fieldset-legend">Clinical Measurements</p>
                <div className="form-grid">
                  {NUMERIC_FIELDS.map((field) => (
                    <div
                      key={field.name}
                      className={[
                        'field-group',
                        field.readonly ? 'field-readonly' : '',
                        fieldErrors[field.name] ? 'field-invalid' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <label htmlFor={field.name} className="field-label">
                        {field.label}
                        {field.unit && (
                          <span className="field-unit">&thinsp;{field.unit}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        id={field.name}
                        name={field.name}
                        value={form[field.name]}
                        onChange={handleChange}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        placeholder={field.placeholder}
                        readOnly={field.readonly}
                        className={['field-input', field.readonly ? 'input-readonly' : '']
                          .filter(Boolean)
                          .join(' ')}
                      />
                      {field.readonly && (
                        <small className="field-hint">Auto-calculated</small>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Symptoms & Lifestyle */}
              <div className="fieldset-wrap">
                <p className="fieldset-legend">Symptoms &amp; Lifestyle</p>
                <div className="checkbox-grid">
                  {BINARY_FIELDS.map((field) => (
                    <label
                      key={field.name}
                      className={['checkbox-card', form[field.name] ? 'cb-checked' : ''].filter(Boolean).join(' ')}
                    >
                      <input
                        type="checkbox"
                        name={field.name}
                        id={field.name}
                        checked={form[field.name]}
                        onChange={handleChange}
                        className="cb-input"
                      />
                      <span className="cb-box" aria-hidden="true" />
                      <span className="cb-label">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {submitError && (
                <p className="form-error" role="alert">
                  {submitError}
                </p>
              )}

              <div className="submit-row">
                <button
                  type="submit"
                  className={['btn-submit', loading ? 'btn-loading' : ''].filter(Boolean).join(' ')}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      <span>Analysing&hellip;</span>
                    </>
                  ) : (
                    <span>Predict PCOS Risk</span>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ===== RESULT ===== */}
          {result && (
            <section className="card result-card" id="result-section">
              <h2 className="result-title">Prediction Result</h2>

              <div className="result-main">
                {/* Gauge */}
                <div className="gauge-wrapper">
                  <div
                    className={['gauge', isHigh ? 'gauge-high' : 'gauge-low'].join(' ')}
                    style={{
                      background: `conic-gradient(currentColor ${gaugeDeg}deg, rgba(0,0,0,0.08) 0deg)`,
                    }}
                    aria-label={`${result.probability}% probability`}
                  >
                    <div className="gauge-inner">
                      <span className="gauge-num">
                        <AnimatedValue target={result.probability} />
                      </span>
                      <span className="gauge-pct">%</span>
                    </div>
                  </div>
                </div>

                {/* Risk Info */}
                <div className="risk-info">
                  <div className={['risk-badge', isHigh ? 'risk-high' : 'risk-low'].join(' ')}>
                    {result.risk}
                  </div>
                  <p className="risk-desc">
                    {isHigh
                      ? `The model estimates a ${result.probability}% probability of PCOS. Please seek medical advice.`
                      : `The model estimates a ${result.probability}% probability of PCOS. Maintain a healthy lifestyle.`}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="recommendations">
                <h3 className="rec-heading">Recommendations</h3>
                <ul className="rec-list">
                  {(isHigh ? HIGH_RECS : LOW_RECS).map((rec, i) => (
                    <li key={i} className="rec-item">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="reset-row">
                <button type="button" className="btn-reset" onClick={handleReset}>
                  Start Over
                </button>
              </div>
            </section>
          )}
        </main>

        <footer className="footer">
          <p>
            PCOS Risk Assessment &nbsp;&middot;&nbsp; Built with scikit-learn &amp; Flask
            &nbsp;&middot;&nbsp; <em>For educational use only</em>
          </p>
        </footer>
      </div>
    </>
  );
}
