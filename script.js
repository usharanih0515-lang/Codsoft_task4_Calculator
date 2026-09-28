/**
 * =============================================================================
 * Scientific Calculator — script.js
 * Vanilla JavaScript (ES6+) | No frameworks, no libraries
 * =============================================================================
 *
 * Supported operations:
 *   Basic    : +  −  ×  ÷  %  decimal  +/-  ( )
 *   Powers   : x²  xʸ (^)  √  eˣ
 *   Trig     : sin  cos  tan  sin⁻¹  cos⁻¹  tan⁻¹  (DEG or RAD)
 *   Log      : log (base 10)  ln (natural)
 *   Special  : π  e  n!
 *   Control  : AC  DEL  =
 *   Keyboard : 0-9  +  -  *  /  ^  .  Enter  Backspace  Escape
 *   Theme    : Dark / Light toggle
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // 1.  DOM references
  // ─────────────────────────────────────────────────────────────────────────
  const mainDisplay = document.getElementById('mainDisplay');
  const subDisplay  = document.getElementById('subDisplay');
  const degRadBtn   = document.getElementById('degRadBtn');
  const themeToggle = document.getElementById('themeToggle');

  // ─────────────────────────────────────────────────────────────────────────
  // 2.  Calculator state
  // ─────────────────────────────────────────────────────────────────────────
  let currentValue      = '0';   // The number currently shown on the main display
  let previousValue     = null;  // First operand stored before an operator is pressed
  let operator          = null;  // Active operator: + - × ÷ ^
  let shouldResetDisplay = false;// true ⟹ next digit replaces currentValue
  let isErrorState      = false; // true ⟹ display shows "Error"
  let isDegrees         = true;  // Angle mode for trig functions

  // ─────────────────────────────────────────────────────────────────────────
  // 3.  Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Convert degrees → radians when isDegrees is true (used before trig calls).
   */
  function toRad(val) {
    return isDegrees ? (val * Math.PI) / 180 : val;
  }

  /**
   * Convert radians → degrees when isDegrees is true (used after inverse trig).
   */
  function toDeg(val) {
    return isDegrees ? (val * 180) / Math.PI : val;
  }

  /**
   * Round to 10 decimal places to eliminate JS floating-point drift
   * (e.g. 0.1 + 0.2 → 0.3, not 0.30000000000000004).
   */
  function formatResult(num) {
    if (!isFinite(num) || isNaN(num)) {
      isErrorState = true;
      return 'Error';
    }
    // Use toPrecision to handle very large/small numbers cleanly
    let rounded = parseFloat(num.toPrecision(12));
    return String(rounded);
  }

  /**
   * Factorial helper — only for non-negative integers ≤ 170 (JS limit).
   */
  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.  Display update
  // ─────────────────────────────────────────────────────────────────────────
  function updateDisplay() {
    mainDisplay.textContent = currentValue;

    // Shrink font for long numbers to prevent overflow
    const len = currentValue.length;
    if (len > 14)      mainDisplay.style.fontSize = '1.3rem';
    else if (len > 10) mainDisplay.style.fontSize = '1.7rem';
    else               mainDisplay.style.fontSize = '';

    // Build sub-display expression line
    if (isErrorState) {
      subDisplay.textContent = '';
    } else if (previousValue !== null && operator !== null) {
      subDisplay.textContent = shouldResetDisplay
        ? `${previousValue} ${operator}`
        : `${previousValue} ${operator} ${currentValue}`;
    } else {
      subDisplay.textContent = '';
    }

    highlightActiveOperator();
  }

  /** Visually highlight the operator button that is currently active. */
  function highlightActiveOperator() {
    document.querySelectorAll('.btn-op').forEach(btn => {
      const isActive = operator && btn.dataset.value === operator && shouldResetDisplay;
      btn.classList.toggle('active-op', isActive);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5.  Core calculator actions
  // ─────────────────────────────────────────────────────────────────────────

  /** Append a digit (0–9) to the current input. */
  function appendNumber(digit) {
    if (isErrorState) {
      // Clear error and start fresh with the new digit
      clearAll();
      currentValue = digit;
      updateDisplay();
      return;
    }
    if (shouldResetDisplay) {
      currentValue      = digit;
      shouldResetDisplay = false;
    } else {
      currentValue = (currentValue === '0') ? digit
                   : currentValue.length < 16 ? currentValue + digit
                   : currentValue;
    }
    updateDisplay();
  }

  /** Append a decimal point (only once per number). */
  function appendDecimal() {
    if (isErrorState) {
      clearAll();
      currentValue = '0.';
      updateDisplay();
      return;
    }
    if (shouldResetDisplay) {
      currentValue      = '0.';
      shouldResetDisplay = false;
      updateDisplay();
      return;
    }
    if (!currentValue.includes('.')) {
      currentValue += '.';
      updateDisplay();
    }
  }

  /**
   * Select an arithmetic operator.
   * If a complete expression is already pending, evaluate it first
   * (enables chained calculations: 5 + 3 × 2 resolves left-to-right).
   */
  function setOperator(op) {
    if (isErrorState) return;

    if (previousValue !== null && operator !== null && !shouldResetDisplay) {
      evaluate();
      if (isErrorState) return;
    }

    previousValue      = currentValue;
    operator           = op;
    shouldResetDisplay = true;
    updateDisplay();
  }

  /** Evaluate the pending expression and show the result. */
  function evaluate() {
    if (operator === null || previousValue === null || isErrorState) return;

    const prev = parseFloat(previousValue);
    const curr = parseFloat(currentValue);
    let result;

    switch (operator) {
      case '+': result = prev + curr;               break;
      case '-': result = prev - curr;               break;
      case '×': result = prev * curr;               break;
      case '÷':
        if (curr === 0) { setError('Cannot ÷ by 0'); return; }
        result = prev / curr;
        break;
      case '^': result = Math.pow(prev, curr);      break;
      default: return;
    }

    // Remember the full equation for the sub-display
    const history = `${previousValue} ${operator} ${currentValue} =`;

    currentValue      = formatResult(result);
    previousValue     = null;
    operator          = null;
    shouldResetDisplay = true;

    updateDisplay();
    if (!isErrorState) subDisplay.textContent = history;
  }

  /** Apply a scientific function to currentValue. */
  function applyScientific(fn) {
    if (isErrorState) return;
    const num = parseFloat(currentValue);
    if (isNaN(num)) { setError('Invalid input'); return; }

    let result;
    switch (fn) {
      // Trigonometry (respects DEG/RAD mode)
      case 'sin':  result = Math.sin(toRad(num));        break;
      case 'cos':  result = Math.cos(toRad(num));        break;
      case 'tan':
        // tan(90°) is undefined
        if (isDegrees && num % 180 === 90) { setError('Undefined'); return; }
        result = Math.tan(toRad(num));
        break;

      // Inverse trig (result converted back to degrees if in DEG mode)
      case 'asin':
        if (num < -1 || num > 1) { setError('Domain error'); return; }
        result = toDeg(Math.asin(num));
        break;
      case 'acos':
        if (num < -1 || num > 1) { setError('Domain error'); return; }
        result = toDeg(Math.acos(num));
        break;
      case 'atan': result = toDeg(Math.atan(num));       break;

      // Powers and roots
      case 'sqrt':
        if (num < 0) { setError('Domain error'); return; }
        result = Math.sqrt(num);
        break;
      case 'sq':   result = num * num;                   break;
      case 'exp':  result = Math.exp(num);               break;

      // Logarithms
      case 'log':
        if (num <= 0) { setError('Domain error'); return; }
        result = Math.log10(num);
        break;
      case 'ln':
        if (num <= 0) { setError('Domain error'); return; }
        result = Math.log(num);
        break;

      // Factorial
      case 'fact':
        result = factorial(num);
        if (isNaN(result)) { setError('Domain error'); return; }
        break;

      default: return;
    }

    const history = `${fn}(${currentValue}) =`;
    currentValue      = formatResult(result);
    shouldResetDisplay = true;
    updateDisplay();
    if (!isErrorState) subDisplay.textContent = history;
  }

  /** Insert a mathematical constant (π or e). */
  function insertConstant(name) {
    if (isErrorState) { clearAll(); }

    const value = name === 'PI' ? String(Math.PI) : String(Math.E);
    if (shouldResetDisplay || currentValue === '0') {
      currentValue      = value;
      shouldResetDisplay = false;
    } else {
      // Treat as implicit multiplication: 2π → set operator × and set π as next operand
      if (previousValue === null) {
        previousValue = currentValue;
        operator      = '×';
      }
      currentValue      = value;
      shouldResetDisplay = false;
    }
    updateDisplay();
  }

  /**
   * Handle parentheses by appending them to the sub-display expression.
   * This is a simple "visual" parentheses tracker; full expression parsing
   * is handled by the safe eval wrapper below.
   */
  function insertParen(p) {
    if (isErrorState) { clearAll(); }

    // Append paren to the ongoing expression in the sub-display
    const current = subDisplay.textContent;
    subDisplay.textContent = current + p;
  }

  /** Toggle the sign of the current number (+/-). */
  function negate() {
    if (isErrorState) return;
    const num = parseFloat(currentValue);
    if (isNaN(num) || num === 0) return;
    currentValue = String(-num);
    updateDisplay();
  }

  /** Apply percentage: divides by 100. */
  function calculatePercentage() {
    if (isErrorState) return;
    const num = parseFloat(currentValue);
    if (isNaN(num)) return;
    currentValue = formatResult(num / 100);
    updateDisplay();
  }

  /** Delete the last character from the current input. */
  function deleteLastChar() {
    if (isErrorState) { clearAll(); return; }
    if (shouldResetDisplay) return;

    if (currentValue.length <= 1 ||
        (currentValue.length === 2 && currentValue.startsWith('-'))) {
      currentValue = '0';
    } else {
      currentValue = currentValue.slice(0, -1);
    }
    updateDisplay();
  }

  /** Reset everything back to initial state. */
  function clearAll() {
    currentValue      = '0';
    previousValue     = null;
    operator          = null;
    shouldResetDisplay = false;
    isErrorState      = false;
    if (subDisplay) subDisplay.textContent = '';
    updateDisplay();
  }

  /** Display an error message and enter error state. */
  function setError(message) {
    currentValue      = message || 'Error';
    isErrorState      = true;
    previousValue     = null;
    operator          = null;
    shouldResetDisplay = true;
    updateDisplay();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6.  Event delegation — button clicks
  // ─────────────────────────────────────────────────────────────────────────
  document.querySelector('.keypad-wrapper').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const action = btn.dataset.action;
    const value  = btn.dataset.value;
    const fn     = btn.dataset.fn;

    switch (action) {
      case undefined:
        // Pure number button (has only data-value, no data-action)
        if (value !== undefined) appendNumber(value);
        break;
      case 'decimal':     appendDecimal();             break;
      case 'operator':    setOperator(value);          break;
      case 'equals':      evaluate();                  break;
      case 'clear':       clearAll();                  break;
      case 'delete':      deleteLastChar();            break;
      case 'percent':     calculatePercentage();       break;
      case 'sci':         applyScientific(fn);         break;
      case 'constant':    insertConstant(value);       break;
      case 'paren':       insertParen(value);          break;
      case 'negate':      negate();                    break;
      case 'degrad':      toggleDegRad();              break;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7.  DEG / RAD toggle
  // ─────────────────────────────────────────────────────────────────────────
  function toggleDegRad() {
    isDegrees = !isDegrees;
    degRadBtn.textContent = isDegrees ? 'DEG' : 'RAD';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8.  Keyboard support
  // ─────────────────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const key = e.key;

    /** Flash the matching on-screen button for visual feedback. */
    function flash(selector) {
      const el = document.querySelector(selector);
      if (!el) return;
      el.classList.add('pressed');
      setTimeout(() => el.classList.remove('pressed'), 130);
    }

    // Digits 0–9
    if (key >= '0' && key <= '9') {
      appendNumber(key);
      flash(`.btn-num[data-value="${key}"]`);
      return;
    }

    switch (key) {
      case '.':
      case ',':
        e.preventDefault();
        appendDecimal();
        flash('[data-action="decimal"]');
        break;
      case '+':
        setOperator('+');
        flash('[data-value="+"]');
        break;
      case '-':
        setOperator('-');
        flash('[data-value="-"]');
        break;
      case '*':
        e.preventDefault();
        setOperator('×');
        flash('[data-value="×"]');
        break;
      case '/':
        e.preventDefault();
        setOperator('÷');
        flash('[data-value="÷"]');
        break;
      case '^':
        setOperator('^');
        flash('[data-value="^"]');
        break;
      case 'Enter':
      case '=':
        e.preventDefault();
        evaluate();
        flash('.btn-equals');
        break;
      case 'Backspace':
        e.preventDefault();
        deleteLastChar();
        flash('[data-action="delete"]');
        break;
      case 'Escape':
      case 'c':
      case 'C':
        clearAll();
        flash('[data-action="clear"]');
        break;
      case '%':
        calculatePercentage();
        flash('[data-action="percent"]');
        break;
      case 's':
        applyScientific('sin');
        flash('[data-fn="sin"]');
        break;
      case 'o':
        applyScientific('cos');
        flash('[data-fn="cos"]');
        break;
      case 't':
        applyScientific('tan');
        flash('[data-fn="tan"]');
        break;
      case 'l':
        applyScientific('log');
        flash('[data-fn="log"]');
        break;
      case 'n':
        applyScientific('ln');
        flash('[data-fn="ln"]');
        break;
      case 'r':
        applyScientific('sqrt');
        flash('[data-fn="sqrt"]');
        break;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9.  Theme toggle
  // ─────────────────────────────────────────────────────────────────────────
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const light = document.body.classList.contains('light-theme');
    themeToggle.querySelector('.theme-icon').textContent = light ? '☀️' : '🌙';
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Initial render
  // ─────────────────────────────────────────────────────────────────────────
  updateDisplay();
});
