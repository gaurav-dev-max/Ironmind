
  <script>
    const foodDB = [
      { keys: ["egg", "eggs", "boiled egg"], unit: "piece", cal: 72, p: 6.3, c: 0.4, f: 5.0 },
      { keys: ["egg white", "egg whites"], unit: "piece", cal: 17, p: 3.6, c: 0.2, f: 0.1 },
      { keys: ["chicken", "chicken breast"], unit: "100g", cal: 165, p: 31, c: 0, f: 3.6 },
      { keys: ["whey", "protein powder", "whey protein"], unit: "scoop", cal: 125, p: 25, c: 3, f: 1.5 },
      { keys: ["paneer", "cottage cheese"], unit: "100g", cal: 265, p: 18, c: 3, f: 20 },
      { keys: ["tofu"], unit: "100g", cal: 83, p: 10, c: 2, f: 4.8 },
      { keys: ["roti", "chapati", "phulka"], unit: "piece", cal: 85, p: 3, c: 18, f: 0.5 },
      { keys: ["rice", "white rice", "cooked rice"], unit: "100g", cal: 130, p: 2.7, c: 28, f: 0.3 },
      { keys: ["oats", "oatmeal"], unit: "100g", cal: 389, p: 16.9, c: 66, f: 6.9 },
      { keys: ["milk"], unit: "100ml", cal: 58, p: 3.1, c: 4.8, f: 3.2 },
      { keys: ["banana"], unit: "piece", cal: 89, p: 1.1, c: 23, f: 0.3 },
      { keys: ["peanut butter"], unit: "tablespoon", cal: 95, p: 4, c: 3.5, f: 8 },
      { keys: ["almonds", "badam"], unit: "piece", cal: 7, p: 0.3, c: 0.2, f: 0.6 },
      { keys: ["dal", "lentils"], unit: "100g", cal: 116, p: 9, c: 20, f: 0.4 }
    ];

    const defaultSplits = [
      { name: "Chest & Triceps", recs: ["Flat Barbell Bench Press", "Incline Dumbbell Press", "Cable Chest Fly", "Tricep Pushdown"] },
      { name: "Back & Biceps", recs: ["Conventional Deadlift", "Barbell Bent-Over Row", "Lat Pulldown", "Cable Bicep Curl"] },
      { name: "Legs & Core", recs: ["Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Hanging Leg Raise"] },
      { name: "Shoulders & Arms", recs: ["Overhead Press", "Dumbbell Lateral Raise", "Incline Dumbbell Curl", "Skullcrusher"] }
    ];

    const exerciseCatalog = [
      "Flat Barbell Bench Press", "Incline Dumbbell Press", "Cable Chest Fly", 
      "Tricep Pushdown", "Conventional Deadlift", "Barbell Bent-Over Row", 
      "Lat Pulldown", "Cable Bicep Curl", "Barbell Back Squat", 
      "Romanian Deadlift", "Leg Press", "Hanging Leg Raise", 
      "Overhead Press", "Dumbbell Lateral Raise", "Skullcrusher", "Incline Dumbbell Curl"
    ];

    let splits = JSON.parse(localStorage.getItem('iron_splits') || 'null') || defaultSplits;
    let activeSession = JSON.parse(localStorage.getItem('iron_active_session') || 'null') || [
      { exercise: "Flat Barbell Bench Press", sets: [{ weight: 60, reps: 8, done: false }] }
    ];

    let dietTargets = JSON.parse(localStorage.getItem('iron_diet_targets') || 'null') || {
      calories: 2800, protein: 180, carbs: 320, fats: 75
    };

    let todayMeals = JSON.parse(localStorage.getItem('iron_daily_meals') || '[]');
    let waterConsumed = parseInt(localStorage.getItem('iron_water') || '0', 10);
    let sessionStartTime = Date.now();

    const tabGym = document.getElementById('tab-nav-gym');
    const tabFuel = document.getElementById('tab-nav-fuel');
    const tabFocus = document.getElementById('tab-nav-focus');
    const panelGym = document.getElementById('panel-gym');
    const panelFuel = document.getElementById('panel-fuel');
    const panelFocus = document.getElementById('panel-focus');

    function resetTabs() {
      [tabGym, tabFuel, tabFocus].forEach(t => t.classList.remove('active'));
      [panelGym, panelFuel, panelFocus].forEach(p => p.classList.remove('active'));
    }

    tabGym.addEventListener('click', () => { resetTabs(); tabGym.classList.add('active'); panelGym.classList.add('active'); });
    tabFuel.addEventListener('click', () => { resetTabs(); tabFuel.classList.add('active'); panelFuel.classList.add('active'); });
    tabFocus.addEventListener('click', () => { resetTabs(); tabFocus.classList.add('active'); panelFocus.classList.add('active'); });

    const toast = document.getElementById('toast');
    function triggerToast(text) {
      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function triggerChime(freq = 660) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (err) {}
    }

    let restHandle = null;
    let restSeconds = 0;
    const restClock = document.getElementById('rest-clock');
    const restStatus = document.getElementById('rest-status');

    function formatTime(s) {
      const m = String(Math.floor(s / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      return `${m}:${sec}`;
    }

    function startRestTimer(seconds) {
      clearInterval(restHandle);
      restSeconds = seconds;
      restStatus.textContent = "REST TIMER • RUNNING";
      restStatus.style.color = "var(--emerald)";
      restClock.textContent = formatTime(restSeconds);

      restHandle = setInterval(() => {
        restSeconds--;
        if (restSeconds <= 0) {
          clearInterval(restHandle);
          restStatus.textContent = "REST COMPLETE";
          restStatus.style.color = "var(--rose)";
          restClock.textContent = "00:00";
          triggerChime(800);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } else {
          restClock.textContent = formatTime(restSeconds);
        }
      }, 1000);
    }

    document.getElementById('btn-rest-60').addEventListener('click', () => startRestTimer(60));
    document.getElementById('btn-rest-90').addEventListener('click', () => startRestTimer(90));
    document.getElementById('btn-rest-120').addEventListener('click', () => startRestTimer(120));
    document.getElementById('btn-rest-stop').addEventListener('click', () => {
      clearInterval(restHandle);
      restStatus.textContent = "REST TIMER • IDLE";
      restStatus.style.color = "var(--text-muted)";
      restClock.textContent = "00:00";
    });

    const splitSelector = document.getElementById('split-selector');
    const recsContainer = document.getElementById('recommendations-container');
    const manualExSelect = document.getElementById('manual-ex-select');
    const sessionContainer = document.getElementById('session-exercises-container');
    const metricTonnage = document.getElementById('metric-tonnage');
    const metricCalories = document.getElementById('metric-calories');

    function populateSplitDropdown() {
      splitSelector.innerHTML = '';
      splits.forEach((s, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = s.name;
        splitSelector.appendChild(opt);
      });
      renderRecommendations();
    }

    function renderRecommendations() {
      recsContainer.innerHTML = '';
      const activeSplit = splits[splitSelector.value] || splits[0];
      activeSplit.recs.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'rec-chip';
        chip.textContent = `+ ${name}`;
        chip.addEventListener('click', () => addExerciseToSession(name));
        recsContainer.appendChild(chip);
      });
    }

    splitSelector.addEventListener('change', renderRecommendations);

    function populateManualExercises() {
      manualExSelect.innerHTML = '';
      exerciseCatalog.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        manualExSelect.appendChild(opt);
      });
    }

    function addExerciseToSession(exerciseName) {
      activeSession.push({ exercise: exerciseName, sets: [{ weight: 60, reps: 8, done: false }] });
      renderSession();
      triggerToast(`Added ${exerciseName}`);
    }

    document.getElementById('btn-add-exercise').addEventListener('click', () => {
      const name = manualExSelect.value;
      if (name) addExerciseToSession(name);
    });

    function getPreviousExerciseStats(exerciseName) {
      const logs = JSON.parse(localStorage.getItem('iron_workout_logs') || '[]');
      for (let i = logs.length - 1; i >= 0; i--) {
        const found = logs[i].session?.find(s => s.exercise === exerciseName);
        if (found && found.sets?.length > 0) return found.sets;
      }
      return null;
    }

    function renderSession() {
      sessionContainer.innerHTML = '';
      let totalVolume = 0;
      let totalSetsCount = 0;

      activeSession.forEach((exItem, exIdx) => {
        const block = document.createElement('div');
        block.className = 'exercise-block';

        const prevSets = getPreviousExerciseStats(exItem.exercise);

        let setsHTML = '';
        exItem.sets.forEach((s, sIdx) => {
          totalVolume += (s.weight * s.reps);
          totalSetsCount++;
          const est1RM = Math.round(s.weight * (1 + s.reps / 30));
          const prevSet = prevSets && prevSets[sIdx] ? prevSets[sIdx] : null;
          const ghostText = prevSet ? `Prev: ${prevSet.weight}kg × ${prevSet.reps}` : `Prev: --`;

          setsHTML += `
            <div class="set-row ${s.done ? 'completed' : ''}">
              <div class="set-top">
                <div class="set-meta-group">
                  <span class="set-tag">SET ${sIdx + 1}</span>
                  <span class="ghost-target">${ghostText}</span>
                </div>
                <span class="set-1rm">Est 1RM: ${est1RM} kg</span>
              </div>
              <div class="steppers-grid">
                <div class="step-box">
                  <button class="step-btn" data-act="w-sub" data-ex="${exIdx}" data-set="${sIdx}">-</button>
                  <span class="step-text">${s.weight} kg</span>
                  <button class="step-btn" data-act="w-add" data-ex="${exIdx}" data-set="${sIdx}">+</button>
                </div>
                <div class="step-box">
                  <button class="step-btn" data-act="r-sub" data-ex="${exIdx}" data-set="${sIdx}">-</button>
                  <span class="step-text">${s.reps} reps</span>
                  <button class="step-btn" data-act="r-add" data-ex="${exIdx}" data-set="${sIdx}">+</button>
                </div>
              </div>
              <div style="display:flex; gap:6px; margin-top:2px;">
                <button class="btn-action ${s.done ? '' : 'btn-emerald'}" data-act="toggle-complete" data-ex="${exIdx}" data-set="${sIdx}" style="flex:1; padding:6px; font-size:0.75rem;">
                  ${s.done ? '✔ Set Logged' : 'Log & Auto-Rest (90s)'}
                </button>
                <button class="btn-action" data-act="del-set" data-ex="${exIdx}" data-set="${sIdx}" style="color:var(--rose); padding:4px 10px;">
                  ✕
                </button>
              </div>
            </div>
          `;
        });

        block.innerHTML = `
          <div class="ex-header">
            <span class="ex-title">${exItem.exercise}</span>
            <button class="btn-action" data-act="del-ex" data-ex="${exIdx}" style="color:var(--rose); padding:4px 8px; font-size:0.75rem;">
              Remove
            </button>
          </div>
          <div class="set-list">${setsHTML}</div>
          <button class="btn-action btn-emerald" data-act="add-set" data-ex="${exIdx}" style="padding:6px; font-size:0.8rem; margin-top:4px;">
            + Add Working Set
          </button>
        `;
        sessionContainer.appendChild(block);
      });

      metricTonnage.textContent = `${totalVolume} kg`;
      const hours = Math.max((Date.now() - sessionStartTime) / 3600000, 0.05);
      const burn = Math.round(6.0 * 70 * hours + (totalSetsCount * 4));
      metricCalories.textContent = `${burn} kcal`;

      localStorage.setItem('iron_active_session', JSON.stringify(activeSession));
    }

    sessionContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      const exIdx = parseInt(btn.dataset.ex, 10);
      const setIdx = parseInt(btn.dataset.set, 10);

      if (act === 'w-add') activeSession[exIdx].sets[setIdx].weight += 2.5;
      if (act === 'w-sub') activeSession[exIdx].sets[setIdx].weight = Math.max(0, activeSession[exIdx].sets[setIdx].weight - 2.5);
      if (act === 'r-add') activeSession[exIdx].sets[setIdx].reps += 1;
      if (act === 'r-sub') activeSession[exIdx].sets[setIdx].reps = Math.max(0, activeSession[exIdx].sets[setIdx].reps - 1);
      if (act === 'del-set') activeSession[exIdx].sets.splice(setIdx, 1);
      if (act === 'del-ex') activeSession.splice(exIdx, 1);

      if (act === 'add-set') {
        const last = activeSession[exIdx].sets[activeSession[exIdx].sets.length - 1] || { weight: 60, reps: 8 };
        activeSession[exIdx].sets.push({ weight: last.weight, reps: last.reps, done: false });
      }

      if (act === 'toggle-complete') {
        const currentSet = activeSession[exIdx].sets[setIdx];
        currentSet.done = !currentSet.done;
        if (currentSet.done) {
          startRestTimer(90);
          triggerToast("Set Logged. Rest Clock Running.");
          if (navigator.vibrate) navigator.vibrate(40);
        }
      }
      renderSession();
    });

    document.getElementById('btn-commit').addEventListener('click', () => {
      const logs = JSON.parse(localStorage.getItem('iron_workout_logs') || '[]');
      logs.push({
        date: new Date().toISOString(),
        split: splitSelector.options[splitSelector.selectedIndex]?.textContent || "Training Split",
        tonnage: metricTonnage.textContent,
        session: activeSession
      });
      localStorage.setItem('iron_workout_logs', JSON.stringify(logs));
      triggerToast("Workout Committed to Storage");
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
      const state = {
        logs: JSON.parse(localStorage.getItem('iron_workout_logs') || '[]'),
        meals: JSON.parse(localStorage.getItem('iron_daily_meals') || '[]'),
        splits: JSON.parse(localStorage.getItem('iron_splits') || '[]'),
        targets: dietTargets
      };
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IronMind_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const modalPlate = document.getElementById('modal-plate');
    const plateSummary = document.getElementById('plate-summary');

    document.getElementById('btn-open-plate').addEventListener('click', () => {
      const firstSetWeight = activeSession[0]?.sets[0]?.weight || 60;
      let remainder = firstSetWeight - 20.0;

      if (remainder < 0) {
        plateSummary.innerHTML = `Bar weight is 20 kg.<br>Target (${firstSetWeight} kg) is below bar weight.`;
      } else if (remainder === 0) {
        plateSummary.innerHTML = `Empty 20 kg Barbell.<br><strong>No plates needed.</strong>`;
      } else {
        let perSide = remainder / 2;
        const plateDenoms = [25, 20, 15, 10, 5, 2.5, 1.25];
        let results = [];
        results.push(`Target: <strong>${firstSetWeight} kg</strong>`);
        results.push(`Per Side: <strong>${perSide} kg</strong><br>`);

        plateDenoms.forEach(p => {
          const count = Math.floor(perSide / p);
          if (count > 0) {
            results.push(`• <strong>${p} kg</strong> plate × ${count}`);
            perSide = (perSide % p).toFixed(2);
          }
        });
        plateSummary.innerHTML = results.join('<br>');
      }
      modalPlate.classList.add('show');
    });

    document.getElementById('btn-close-plate').addEventListener('click', () => modalPlate.classList.remove('show'));

    const modalWarmup = document.getElementById('modal-warmup');
    const warmupSummary = document.getElementById('warmup-summary');

    document.getElementById('btn-calc-warmup').addEventListener('click', () => {
      const targetWeight = activeSession[0]?.sets[0]?.weight || 60;
      const p50 = Math.round((targetWeight * 0.5) / 2.5) * 2.5;
      const p70 = Math.round((targetWeight * 0.7) / 2.5) * 2.5;
      const p85 = Math.round((targetWeight * 0.85) / 2.5) * 2.5;

      warmupSummary.innerHTML = `
        Target Work Set: <strong>${targetWeight} kg</strong><br><br>
        1. 20 kg (Empty Bar) × 10 reps<br>
        2. <strong>${p50} kg</strong> (50%) × 5 reps<br>
        3. <strong>${p70} kg</strong> (70%) × 3 reps<br>
        4. <strong>${p85} kg</strong> (85%) × 1 rep (Potentiation)<br><br>
        <em>Rest 2-3 mins before Set 1.</em>
      `;
      modalWarmup.classList.add('show');
    });

    document.getElementById('btn-close-warmup').addEventListener('click', () => modalWarmup.classList.remove('show'));

    const modalSplit = document.getElementById('modal-split');
    const inputSplitName = document.getElementById('input-split-name');
    const inputSplitRecs = document.getElementById('input-split-recs');

    document.getElementById('btn-custom-day').addEventListener('click', () => {
      inputSplitName.value = ''; inputSplitRecs.value = ''; modalSplit.classList.add('show');
    });
    document.getElementById('btn-cancel-split').addEventListener('click', () => modalSplit.classList.remove('show'));

    document.getElementById('btn-save-split').addEventListener('click', () => {
      const name = inputSplitName.value.trim();
      const recs = inputSplitRecs.value.split(',').map(r => r.trim()).filter(r => r.length > 0);
      if (!name) return;
      splits.push({ name, recs: recs.length > 0 ? recs : ["Flat Barbell Bench Press", "Barbell Back Squat"] });
      localStorage.setItem('iron_splits', JSON.stringify(splits));
      populateSplitDropdown();
      splitSelector.value = splits.length - 1;
      renderRecommendations();
      modalSplit.classList.remove('show');
      triggerToast("Custom Split Created");
    });

    const inTargetCal = document.getElementById('in-target-calories');
    const inTargetPro = document.getElementById('in-target-protein');
    const inTargetCarb = document.getElementById('in-target-carbs');
    const inTargetFat = document.getElementById('in-target-fats');

    const calConsumedEl = document.getElementById('cal-consumed');
    const calRemainingEl = document.getElementById('cal-remaining');

    const pConsumedEl = document.getElementById('p-consumed');
    const cConsumedEl = document.getElementById('c-consumed');
    const fConsumedEl = document.getElementById('f-consumed');

    const waterDisplayEl = document.getElementById('water-display');
    const mealsFeedEl = document.getElementById('meals-feed');

    function syncDashboard() {
      dietTargets.calories = parseInt(inTargetCal.value, 10) || 2800;
      dietTargets.protein = parseInt(inTargetPro.value, 10) || 180;
      dietTargets.carbs = parseInt(inTargetCarb.value, 10) || 320;
      dietTargets.fats = parseInt(inTargetFat.value, 10) || 75;

      let totalCal = 0; let totalPro = 0; let totalCarb = 0; let totalFat = 0;

      todayMeals.forEach(m => {
        totalCal += (m.cal || 0);
        totalPro += (m.pro || 0);
        totalCarb += (m.carb || 0);
        totalFat += (m.fat || 0);
      });

      calConsumedEl.textContent = `${totalCal} kcal`;
      const rem = dietTargets.calories - totalCal;
      calRemainingEl.textContent = rem >= 0 ? `${rem} left` : `${Math.abs(rem)} over`;

      pConsumedEl.textContent = totalPro;
      cConsumedEl.textContent = totalCarb;
      fConsumedEl.textContent = totalFat;

      const pctCal = Math.min(100, Math.round((totalCal / dietTargets.calories) * 100));
      const pctPro = Math.min(100, Math.round((totalPro / dietTargets.protein) * 100));
      const pctCarb = Math.min(100, Math.round((totalCarb / dietTargets.carbs) * 100));
      const pctFat = Math.min(100, Math.round((totalFat / dietTargets.fats) * 100));

      document.getElementById('pct-cal').textContent = `${pctCal}%`;
      document.getElementById('pct-pro').textContent = `${pctPro}%`;
      document.getElementById('pct-carb').textContent = `${pctCarb}%`;
      document.getElementById('pct-fat').textContent = `${pctFat}%`;

      document.getElementById('ring-cal').style.background = `conic-gradient(var(--emerald) ${pctCal * 3.6}deg, var(--surface-hover) ${pctCal * 3.6}deg)`;
      document.getElementById('ring-pro').style.background = `conic-gradient(var(--cyan) ${pctPro * 3.6}deg, var(--surface-hover) ${pctPro * 3.6}deg)`;
      document.getElementById('ring-carb').style.background = `conic-gradient(var(--gold) ${pctCarb * 3.6}deg, var(--surface-hover) ${pctCarb * 3.6}deg)`;
      document.getElementById('ring-fat').style.background = `conic-gradient(var(--rose) ${pctFat * 3.6}deg, var(--surface-hover) ${pctFat * 3.6}deg)`;

      waterDisplayEl.textContent = `${waterConsumed} ml`;

      mealsFeedEl.innerHTML = '';
      if (todayMeals.length === 0) {
        mealsFeedEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:12px;">No meals logged today</div>`;
      } else {
        todayMeals.forEach((meal, idx) => {
          const item = document.createElement('div');
          item.className = 'meal-item';
          item.innerHTML = `
            <div class="meal-meta">
              <span class="meal-title">${meal.name}</span>
              <span class="meal-details">${meal.cal} kcal • ${meal.pro}g P • ${meal.carb}g C • ${meal.fat || 0}g F</span>
            </div>
            <button class="step-btn" data-act="del-meal" data-idx="${idx}" style="color:var(--rose); width:28px; height:28px;">✕</button>
          `;
          mealsFeedEl.appendChild(item);
        });
      }

      localStorage.setItem('iron_daily_meals', JSON.stringify(todayMeals));
      localStorage.setItem('iron_diet_targets', JSON.stringify(dietTargets));
      localStorage.setItem('iron_water', waterConsumed.toString());
    }

    [inTargetCal, inTargetPro, inTargetCarb, inTargetFat].forEach(inp => {
      inp.addEventListener('input', syncDashboard);
    });

    const inFoodQuery = document.getElementById('in-food-query');
    const inMealCal = document.getElementById('in-meal-cal');
    const inMealPro = document.getElementById('in-meal-pro');
    const inMealCarb = document.getElementById('in-meal-carb');
    const inMealFat = document.getElementById('in-meal-fat');
    const detectorStatus = document.getElementById('detector-status');

    inFoodQuery.addEventListener('input', () => {
      const query = inFoodQuery.value.toLowerCase().trim();
      if (!query) {
        detectorStatus.textContent = "AI READY"; detectorStatus.style.color = "var(--emerald)";
        inMealCal.value = ''; inMealPro.value = ''; inMealCarb.value = ''; inMealFat.value = ''; return;
      }

      const numMatch = query.match(/(\d+(\.\d+)?)/);
      const quantity = numMatch ? parseFloat(numMatch[1]) : 1;

      let detectedFood = null;
      for (const item of foodDB) {
        for (const key of item.keys) {
          if (query.includes(key)) { detectedFood = item; break; }
        }
        if (detectedFood) break;
      }

      if (detectedFood) {
        let factor = quantity;
        if (detectedFood.unit === "100g" || detectedFood.unit === "100ml") factor = quantity / 100;

        inMealCal.value = Math.round(detectedFood.cal * factor);
        inMealPro.value = Math.round(detectedFood.p * factor);
        inMealCarb.value = Math.round(detectedFood.c * factor);
        inMealFat.value = Math.round((detectedFood.f || 0) * factor);

        detectorStatus.textContent = `DETECTED: ${quantity}${detectedFood.unit === '100g' ? 'g' : ''}`;
        detectorStatus.style.color = "var(--cyan)";
      } else {
        detectorStatus.textContent = "CUSTOM INPUT"; detectorStatus.style.color = "var(--text-muted)";
      }
    });

    document.getElementById('btn-submit-meal').addEventListener('click', () => {
      const title = inFoodQuery.value.trim() || 'Custom Meal';
      const cal = parseInt(inMealCal.value, 10) || 0;
      const pro = parseInt(inMealPro.value, 10) || 0;
      const carb = parseInt(inMealCarb.value, 10) || 0;
      const fat = parseInt(inMealFat.value, 10) || 0;

      todayMeals.unshift({ name: title, cal, pro, carb, fat, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });

      inFoodQuery.value = ''; inMealCal.value = ''; inMealPro.value = ''; inMealCarb.value = ''; inMealFat.value = '';
      detectorStatus.textContent = "AI READY"; detectorStatus.style.color = "var(--emerald)";

      syncDashboard();
      triggerToast("Meal Logged");
    });

    mealsFeedEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.act === 'del-meal') {
        const idx = parseInt(btn.dataset.idx, 10);
        todayMeals.splice(idx, 1);
        syncDashboard();
      }
    });

    document.getElementById('btn-water-250').addEventListener('click', () => { waterConsumed += 250; syncDashboard(); triggerToast("+250ml Logged"); });
    document.getElementById('btn-water-500').addEventListener('click', () => { waterConsumed += 500; syncDashboard(); triggerToast("+500ml Logged"); });
    document.getElementById('btn-water-reset').addEventListener('click', () => { waterConsumed = 0; syncDashboard(); });
    document.getElementById('btn-clear-day').addEventListener('click', () => { todayMeals = []; waterConsumed = 0; syncDashboard(); triggerToast("Day Reset"); });

    let focusHandle = null;
    let focusSeconds = 25 * 60;
    let isFocusActive = false;
    let distractionLeaks = 0;

    const focusClock = document.getElementById('focus-clock');
    const focusStatus = document.getElementById('focus-status');
    const btnFocusToggle = document.getElementById('btn-focus-toggle');
    const distVal = document.getElementById('metric-distractions');

    btnFocusToggle.addEventListener('click', () => {
      if (!isFocusActive) {
        isFocusActive = true;
        btnFocusToggle.textContent = "Pause";
        focusStatus.textContent = "FOCUS • ACTIVE";
        focusHandle = setInterval(() => {
          focusSeconds--;
          if (focusSeconds <= 0) {
            clearInterval(focusHandle);
            isFocusActive = false;
            btnFocusToggle.textContent = "Start";
            focusStatus.textContent = "COMPLETE";
            triggerChime(900);
          }
          focusClock.textContent = formatTime(focusSeconds);
        }, 1000);
      } else {
        clearInterval(focusHandle);
        isFocusActive = false;
        btnFocusToggle.textContent = "Start";
        focusStatus.textContent = "FOCUS • PAUSED";
      }
    });

    document.getElementById('btn-proto-25').addEventListener('click', () => {
      clearInterval(focusHandle); isFocusActive = false; btnFocusToggle.textContent = "Start";
      focusSeconds = 25 * 60; focusStatus.textContent = "POMODORO READY"; focusClock.textContent = formatTime(focusSeconds);
    });

    document.getElementById('btn-proto-90').addEventListener('click', () => {
      clearInterval(focusHandle); isFocusActive = false; btnFocusToggle.textContent = "Start";
      focusSeconds = 90 * 60; focusStatus.textContent = "ULTRADIAN READY"; focusClock.textContent = formatTime(focusSeconds);
    });

    document.getElementById('btn-focus-reset').addEventListener('click', () => {
      clearInterval(focusHandle); isFocusActive = false; btnFocusToggle.textContent = "Start";
      focusSeconds = 25 * 60; focusStatus.textContent = "FOCUS • READY"; focusClock.textContent = formatTime(focusSeconds);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isFocusActive) {
        distractionLeaks++;
        distVal.textContent = distractionLeaks;
        triggerChime(220);
      }
    });

    // MULTI-MODE SYNTHESIZER (White, Brown, 40Hz Gamma)
    let audioCtx = null;
    let activeSource = null;
    let soundMode = 0; // 0: OFF, 1: White Noise, 2: Brown Noise, 3: 40Hz Gamma
    const btnSoundscape = document.getElementById('btn-soundscape');

    function stopAudio() {
      if (activeSource) {
        try { activeSource.stop(); activeSource.disconnect(); } catch (e) {}
        activeSource = null;
      }
    }

    btnSoundscape.addEventListener('click', () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      soundMode = (soundMode + 1) % 4;
      stopAudio();

      if (soundMode === 0) {
        btnSoundscape.textContent = "Audio: OFF";
      } else if (soundMode === 1) {
        btnSoundscape.textContent = "White Noise";
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = audioCtx.createBufferSource();
        src.buffer = buffer; src.loop = true;
        const gain = audioCtx.createGain(); gain.gain.value = 0.02;
        src.connect(gain); gain.connect(audioCtx.destination);
        src.start();
        activeSource = src;
      } else if (soundMode === 2) {
        btnSoundscape.textContent = "Brown Noise";
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buffer; src.loop = true;
        const gain = audioCtx.createGain(); gain.gain.value = 0.06;
        src.connect(gain); gain.connect(audioCtx.destination);
        src.start();
        activeSource = src;
      } else if (soundMode === 3) {
        btnSoundscape.textContent = "40Hz Gamma Focus";
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime); // Carrier tone
        gain.gain.value = 0.05;

        // Modulate at 40Hz
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 40;
        lfoGain.gain.value = 0.04;
        lfo.connect(gain.gain);
        lfo.start();

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        activeSource = osc;
      }
    });

    populateSplitDropdown();
    populateManualExercises();
    renderSession();
    inTargetCal.value = dietTargets.calories;
    inTargetPro.value = dietTargets.protein;
    inTargetCarb.value = dietTargets.carbs;
    inTargetFat.value = dietTargets.fats;
    syncDashboard();
  </script>
</body>
</html>