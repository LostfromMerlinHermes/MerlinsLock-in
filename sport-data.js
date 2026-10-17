// Sport data: muscles, equipment, exercise library, calisthenics skill tree and the line-icon set.
// Pure data + small helpers on ML.SportData; sport.js builds everything else on top.
(() => {
  'use strict';

  // 12 muscle groups shown on the character and the body map
  const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'lowback', 'glutes', 'quads', 'hamstrings', 'calves'];
  // Equipment a person can have (profile) and an exercise can need
  const EQUIP = ['none', 'bar', 'dip', 'rings', 'db', 'band', 'gym'];
  // Character attributes: strength, endurance, agility/explosiveness, mobility, skill (calisthenics)
  const ATTRS = ['STR', 'END', 'AGI', 'MOB', 'SKL'];

  // id: [fr, en, kind (reps|hold|time), equipment needed, level 1-5, pattern, primary muscles, secondary muscles, attribute, weightable, cue fr, cue en]
  const L = {
    // Push
    pushup_knee: ['Pompes sur les genoux', 'Knee push-ups', 'reps', 'none', 1, 'hpush', ['chest'], ['triceps', 'shoulders'], 'END', 0, 'Corps gainé des genoux à la tête.', 'Keep a straight line from knees to head.'],
    pushup: ['Pompes', 'Push-ups', 'reps', 'none', 1, 'hpush', ['chest'], ['triceps', 'shoulders', 'core'], 'END', 0, 'Coudes à 45°, poitrine qui frôle le sol.', 'Elbows at 45°, chest close to the floor.'],
    pushup_wide: ['Pompes larges', 'Wide push-ups', 'reps', 'none', 2, 'hpush', ['chest'], ['shoulders'], 'END', 0, 'Mains plus larges que les épaules.', 'Hands wider than shoulders.'],
    pushup_diamond: ['Pompes diamant', 'Diamond push-ups', 'reps', 'none', 2, 'hpush', ['triceps', 'chest'], ['shoulders'], 'SKL', 0, 'Mains en losange sous la poitrine.', 'Hands in a diamond under your chest.'],
    pushup_decline: ['Pompes déclinées', 'Decline push-ups', 'reps', 'none', 2, 'hpush', ['chest', 'shoulders'], ['triceps'], 'STR', 0, 'Pieds surélevés, gainage serré.', 'Feet raised, tight core.'],
    pushup_archer: ['Pompes archer', 'Archer push-ups', 'reps', 'none', 3, 'hpush', ['chest'], ['triceps', 'shoulders'], 'SKL', 0, 'Un bras travaille, l’autre reste tendu.', 'One arm works, the other stays straight.'],
    pushup_pseudo: ['Pompes pseudo-planche', 'Pseudo planche push-ups', 'reps', 'none', 4, 'hpush', ['chest', 'shoulders'], ['triceps', 'core'], 'SKL', 0, 'Mains vers les hanches, épaules en avant.', 'Hands by the hips, shoulders leaning forward.'],
    pushup_onearm: ['Pompe à un bras', 'One-arm push-up', 'reps', 'none', 5, 'hpush', ['chest', 'triceps'], ['core', 'shoulders'], 'SKL', 0, 'Pieds écartés, hanches parallèles au sol.', 'Feet wide, hips square to the floor.'],
    bench_db: ['Développé couché haltères', 'Dumbbell bench press', 'reps', 'db', 1, 'hpush', ['chest'], ['triceps', 'shoulders'], 'STR', 1, 'Omoplates serrées, descente contrôlée.', 'Shoulder blades tight, controlled descent.'],
    bench_bb: ['Développé couché', 'Bench press', 'reps', 'gym', 2, 'hpush', ['chest'], ['triceps', 'shoulders'], 'STR', 1, 'Pieds ancrés, barre au bas des pecs.', 'Feet planted, bar to lower chest.'],
    pike_pushup: ['Pompes pike', 'Pike push-ups', 'reps', 'none', 2, 'vpush', ['shoulders'], ['triceps'], 'SKL', 0, 'Hanches hautes, tête vers le sol.', 'Hips high, head toward the floor.'],
    hspu_wall: ['Pompes en équilibre au mur', 'Wall handstand push-ups', 'reps', 'none', 4, 'vpush', ['shoulders', 'triceps'], ['core'], 'SKL', 0, 'Descente lente, tête en triangle avec les mains.', 'Lower slowly, head in a triangle with your hands.'],
    ohp_db: ['Développé militaire haltères', 'Dumbbell overhead press', 'reps', 'db', 1, 'vpush', ['shoulders'], ['triceps', 'core'], 'STR', 1, 'Fessiers serrés, ne cambre pas.', 'Squeeze glutes, don’t arch.'],
    ohp_bb: ['Développé militaire barre', 'Barbell overhead press', 'reps', 'gym', 2, 'vpush', ['shoulders'], ['triceps', 'core'], 'STR', 1, 'Barre au-dessus de la tête, en ligne.', 'Bar stacked over your head.'],
    dips_bench: ['Dips sur banc', 'Bench dips', 'reps', 'none', 1, 'dip', ['triceps'], ['chest', 'shoulders'], 'END', 0, 'Coudes vers l’arrière.', 'Elbows point back.'],
    dips: ['Dips', 'Dips', 'reps', 'dip', 2, 'dip', ['triceps', 'chest'], ['shoulders'], 'STR', 1, 'Descends jusqu’à 90° aux coudes.', 'Lower to 90° at the elbows.'],
    ring_dips: ['Dips aux anneaux', 'Ring dips', 'reps', 'rings', 4, 'dip', ['triceps', 'chest'], ['shoulders', 'core'], 'SKL', 1, 'Anneaux serrés contre le corps.', 'Keep the rings close to your body.'],
    lateral_raise: ['Élévations latérales', 'Lateral raises', 'reps', 'db', 1, 'shoulder', ['shoulders'], [], 'STR', 1, 'Coudes légèrement fléchis, monte jusqu’aux épaules.', 'Slight elbow bend, raise to shoulder height.'],
    band_pull_apart: ['Écartés élastique', 'Band pull-aparts', 'reps', 'band', 1, 'shoulder', ['shoulders', 'back'], [], 'MOB', 0, 'Bras tendus, serre les omoplates.', 'Straight arms, squeeze shoulder blades.'],
    triceps_ext: ['Extensions triceps', 'Triceps extensions', 'reps', 'db', 1, 'triceps', ['triceps'], [], 'STR', 1, 'Coudes fixes.', 'Keep elbows still.'],
    // Pull
    aus_row: ['Rowing australien', 'Australian rows', 'reps', 'none', 1, 'hpull', ['back'], ['biceps', 'forearms'], 'END', 0, 'Sous une table ou une barre basse, corps gainé.', 'Under a table or low bar, body straight.'],
    row_db: ['Rowing haltère', 'Dumbbell row', 'reps', 'db', 1, 'hpull', ['back'], ['biceps'], 'STR', 1, 'Tire le coude vers la hanche.', 'Pull your elbow toward your hip.'],
    row_bb: ['Rowing barre', 'Barbell row', 'reps', 'gym', 2, 'hpull', ['back'], ['biceps', 'lowback'], 'STR', 1, 'Dos plat, buste penché.', 'Flat back, torso leaning forward.'],
    cable_row: ['Tirage horizontal', 'Seated cable row', 'reps', 'gym', 1, 'hpull', ['back'], ['biceps'], 'STR', 1, 'Poitrine haute, omoplates serrées.', 'Chest up, squeeze shoulder blades.'],
    band_row: ['Rowing élastique', 'Band row', 'reps', 'band', 1, 'hpull', ['back'], ['biceps'], 'END', 0, 'Coudes près du corps.', 'Elbows close to your body.'],
    pullup_neg: ['Tractions négatives', 'Negative pull-ups', 'reps', 'bar', 1, 'vpull', ['back'], ['biceps', 'forearms'], 'SKL', 0, 'Saute en haut, descends en 5 secondes.', 'Jump up, lower in 5 seconds.'],
    band_pullup: ['Tractions assistées élastique', 'Band-assisted pull-ups', 'reps', 'bar', 1, 'vpull', ['back'], ['biceps'], 'END', 0, 'Élastique sous les pieds ou les genoux.', 'Band under your feet or knees.'],
    pullup: ['Tractions', 'Pull-ups', 'reps', 'bar', 2, 'vpull', ['back'], ['biceps', 'forearms', 'core'], 'SKL', 1, 'Menton au-dessus de la barre, bras tendus en bas.', 'Chin over the bar, full hang at the bottom.'],
    chinup: ['Tractions supination', 'Chin-ups', 'reps', 'bar', 2, 'vpull', ['back', 'biceps'], ['forearms'], 'STR', 1, 'Paumes vers toi.', 'Palms facing you.'],
    pullup_wide: ['Tractions larges', 'Wide pull-ups', 'reps', 'bar', 3, 'vpull', ['back'], ['shoulders', 'biceps'], 'SKL', 1, 'Mains larges, poitrine vers la barre.', 'Wide grip, chest to the bar.'],
    chest_to_bar: ['Tractions poitrine à la barre', 'Chest-to-bar pull-ups', 'reps', 'bar', 4, 'vpull', ['back'], ['biceps', 'core'], 'SKL', 0, 'Tire jusqu’à toucher la barre avec la poitrine.', 'Pull until your chest touches the bar.'],
    archer_pullup: ['Tractions archer', 'Archer pull-ups', 'reps', 'bar', 4, 'vpull', ['back', 'biceps'], ['forearms'], 'SKL', 0, 'Un bras tire, l’autre glisse tendu.', 'One arm pulls, the other slides straight.'],
    muscle_up: ['Muscle-up', 'Muscle-up', 'reps', 'bar', 5, 'vpull', ['back', 'triceps', 'chest'], ['core', 'shoulders'], 'SKL', 0, 'Traction explosive puis passe les poignets.', 'Explosive pull, then turn the wrists over.'],
    lat_pulldown: ['Tirage vertical', 'Lat pulldown', 'reps', 'gym', 1, 'vpull', ['back'], ['biceps'], 'STR', 1, 'Barre vers le haut de la poitrine.', 'Bar to your upper chest.'],
    face_pull: ['Face pull', 'Face pull', 'reps', 'band', 1, 'rear', ['shoulders', 'back'], [], 'MOB', 1, 'Tire vers le visage, coudes hauts.', 'Pull to your face, elbows high.'],
    curl_db: ['Curl haltères', 'Dumbbell curl', 'reps', 'db', 1, 'biceps', ['biceps'], ['forearms'], 'STR', 1, 'Coudes collés, pas d’élan.', 'Elbows pinned, no swinging.'],
    curl_bb: ['Curl barre', 'Barbell curl', 'reps', 'gym', 1, 'biceps', ['biceps'], ['forearms'], 'STR', 1, 'Montée contrôlée.', 'Controlled lift.'],
    hammer_curl: ['Curl marteau', 'Hammer curl', 'reps', 'db', 1, 'biceps', ['biceps', 'forearms'], [], 'STR', 1, 'Pouces vers le haut.', 'Thumbs up.'],
    dead_hang: ['Suspension à la barre', 'Dead hang', 'hold', 'bar', 1, 'grip', ['forearms'], ['back', 'shoulders'], 'END', 0, 'Épaules actives, respire.', 'Active shoulders, breathe.'],
    // Legs
    squat_bw: ['Squat', 'Bodyweight squat', 'reps', 'none', 1, 'squat', ['quads', 'glutes'], ['hamstrings', 'core'], 'END', 0, 'Genoux dans l’axe des pieds, dos droit.', 'Knees over toes, back straight.'],
    jump_squat: ['Squats sautés', 'Jump squats', 'reps', 'none', 2, 'squat', ['quads', 'glutes'], ['calves'], 'AGI', 0, 'Réception souple.', 'Land softly.'],
    lunge: ['Fentes', 'Lunges', 'reps', 'none', 1, 'single', ['quads', 'glutes'], ['hamstrings'], 'END', 0, 'Genou arrière près du sol.', 'Back knee close to the floor.'],
    bulgarian: ['Squat bulgare', 'Bulgarian split squat', 'reps', 'none', 2, 'single', ['quads', 'glutes'], ['hamstrings', 'core'], 'STR', 1, 'Pied arrière sur une chaise.', 'Back foot on a chair.'],
    pistol_assist: ['Pistol squat assisté', 'Assisted pistol squat', 'reps', 'none', 3, 'single', ['quads', 'glutes'], ['core'], 'SKL', 0, 'Tiens un poteau pour l’équilibre.', 'Hold a post for balance.'],
    pistol: ['Pistol squat', 'Pistol squat', 'reps', 'none', 4, 'single', ['quads', 'glutes'], ['core', 'calves'], 'SKL', 1, 'Jambe libre tendue devant.', 'Free leg straight in front.'],
    shrimp: ['Shrimp squat', 'Shrimp squat', 'reps', 'none', 5, 'single', ['quads', 'glutes'], ['core'], 'SKL', 0, 'Tiens ton pied arrière, genou au sol.', 'Hold your back foot, knee to the floor.'],
    goblet: ['Goblet squat', 'Goblet squat', 'reps', 'db', 1, 'squat', ['quads', 'glutes'], ['core'], 'STR', 1, 'Haltère contre la poitrine.', 'Dumbbell against your chest.'],
    squat_bb: ['Squat barre', 'Barbell squat', 'reps', 'gym', 2, 'squat', ['quads', 'glutes'], ['hamstrings', 'lowback', 'core'], 'STR', 1, 'Pousse le sol, poitrine haute.', 'Push the floor away, chest up.'],
    leg_press: ['Presse à cuisses', 'Leg press', 'reps', 'gym', 1, 'squat', ['quads', 'glutes'], [], 'STR', 1, 'Bas du dos collé au dossier.', 'Lower back against the pad.'],
    glute_bridge: ['Pont fessier', 'Glute bridge', 'reps', 'none', 1, 'hinge', ['glutes'], ['hamstrings', 'lowback'], 'END', 0, 'Serre les fessiers en haut.', 'Squeeze glutes at the top.'],
    hip_thrust: ['Hip thrust', 'Hip thrust', 'reps', 'db', 2, 'hinge', ['glutes'], ['hamstrings'], 'STR', 1, 'Dos sur un banc, menton rentré.', 'Back on a bench, chin tucked.'],
    rdl_db: ['Soulevé de terre roumain haltères', 'Dumbbell Romanian deadlift', 'reps', 'db', 1, 'hinge', ['hamstrings', 'glutes'], ['lowback'], 'STR', 1, 'Hanches en arrière, dos plat.', 'Hips back, flat back.'],
    rdl_bb: ['Soulevé de terre roumain', 'Romanian deadlift', 'reps', 'gym', 2, 'hinge', ['hamstrings', 'glutes'], ['lowback', 'forearms'], 'STR', 1, 'Barre près des jambes.', 'Bar close to your legs.'],
    deadlift: ['Soulevé de terre', 'Deadlift', 'reps', 'gym', 3, 'hinge', ['lowback', 'glutes', 'hamstrings'], ['back', 'forearms', 'quads'], 'STR', 1, 'Pousse le sol, barre collée.', 'Push the floor, bar close.'],
    nordic: ['Nordic curl', 'Nordic curl', 'reps', 'none', 4, 'hamstring', ['hamstrings'], ['glutes'], 'SKL', 0, 'Pieds bloqués, descente très lente.', 'Feet anchored, lower very slowly.'],
    leg_curl: ['Leg curl', 'Leg curl', 'reps', 'gym', 1, 'hamstring', ['hamstrings'], [], 'STR', 1, 'Mouvement lent.', 'Slow movement.'],
    calf_raise: ['Mollets debout', 'Calf raises', 'reps', 'none', 1, 'calves', ['calves'], [], 'END', 1, 'Pause en haut.', 'Pause at the top.'],
    wall_sit: ['Chaise contre le mur', 'Wall sit', 'hold', 'none', 1, 'squat', ['quads'], ['glutes'], 'END', 0, 'Cuisses parallèles au sol.', 'Thighs parallel to the floor.'],
    // Core
    plank: ['Planche', 'Plank', 'hold', 'none', 1, 'core', ['core'], ['shoulders'], 'END', 0, 'Bassin rentré, corps en ligne.', 'Tuck your pelvis, body in a line.'],
    side_plank: ['Planche latérale', 'Side plank', 'hold', 'none', 1, 'core', ['core'], ['shoulders'], 'END', 0, 'Hanches hautes.', 'Hips high.'],
    hollow: ['Hollow hold', 'Hollow hold', 'hold', 'none', 2, 'core', ['core'], [], 'SKL', 0, 'Bas du dos collé au sol.', 'Lower back glued to the floor.'],
    crunch: ['Crunch', 'Crunch', 'reps', 'none', 1, 'core', ['core'], [], 'END', 0, 'Enroule le haut du dos.', 'Curl your upper back.'],
    leg_raise: ['Relevés de jambes au sol', 'Lying leg raises', 'reps', 'none', 1, 'core', ['core'], [], 'END', 0, 'Bas du dos au sol.', 'Lower back on the floor.'],
    hang_knee: ['Relevés de genoux suspendu', 'Hanging knee raises', 'reps', 'bar', 2, 'core', ['core'], ['forearms'], 'SKL', 0, 'Pas de balancier.', 'No swinging.'],
    hang_leg: ['Relevés de jambes suspendu', 'Hanging leg raises', 'reps', 'bar', 3, 'core', ['core'], ['forearms'], 'SKL', 0, 'Jambes tendues jusqu’à 90°.', 'Straight legs to 90°.'],
    toes_to_bar: ['Pieds à la barre', 'Toes to bar', 'reps', 'bar', 4, 'core', ['core'], ['back', 'forearms'], 'SKL', 0, 'Touche la barre avec les pieds.', 'Touch the bar with your feet.'],
    lsit: ['L-sit', 'L-sit', 'hold', 'none', 3, 'core', ['core', 'triceps'], ['quads'], 'SKL', 0, 'Jambes tendues, épaules basses.', 'Straight legs, shoulders down.'],
    vsit: ['V-sit', 'V-sit', 'hold', 'none', 5, 'core', ['core', 'triceps'], ['shoulders'], 'SKL', 0, 'Jambes au-dessus des hanches.', 'Legs above your hips.'],
    dragon_flag: ['Dragon flag', 'Dragon flag', 'reps', 'none', 4, 'core', ['core'], ['back'], 'SKL', 0, 'Corps rigide, descente lente.', 'Rigid body, slow descent.'],
    ab_wheel: ['Roue abdominale', 'Ab wheel rollout', 'reps', 'gym', 2, 'core', ['core'], ['shoulders', 'back'], 'STR', 0, 'Ne cambre pas.', 'Don’t arch.'],
    russian_twist: ['Russian twist', 'Russian twist', 'reps', 'none', 1, 'core', ['core'], [], 'END', 1, 'Rotation du buste, pieds levés.', 'Rotate your torso, feet up.'],
    superman: ['Superman', 'Superman', 'hold', 'none', 1, 'lowback', ['lowback'], ['glutes'], 'END', 0, 'Bras et jambes décollés.', 'Arms and legs lifted.'],
    // Static skills
    tuck_fl: ['Front lever groupé', 'Tuck front lever', 'hold', 'bar', 3, 'skill', ['back', 'core'], ['biceps', 'forearms'], 'SKL', 0, 'Bras tendus, dos à l’horizontale.', 'Straight arms, back horizontal.'],
    adv_tuck_fl: ['Front lever groupé avancé', 'Advanced tuck front lever', 'hold', 'bar', 4, 'skill', ['back', 'core'], ['biceps'], 'SKL', 0, 'Dos plat, genoux ouverts.', 'Flat back, knees open.'],
    straddle_fl: ['Front lever écarté', 'Straddle front lever', 'hold', 'bar', 5, 'skill', ['back', 'core'], ['biceps'], 'SKL', 0, 'Jambes écartées, corps aligné.', 'Legs apart, body aligned.'],
    full_fl: ['Front lever', 'Full front lever', 'hold', 'bar', 5, 'skill', ['back', 'core'], ['biceps', 'shoulders'], 'SKL', 0, 'Corps entier à l’horizontale.', 'Whole body horizontal.'],
    tuck_bl: ['Back lever groupé', 'Tuck back lever', 'hold', 'bar', 3, 'skill', ['back', 'shoulders'], ['biceps', 'core'], 'SKL', 0, 'Rentre doucement, épaules prudentes.', 'Enter slowly, careful shoulders.'],
    full_bl: ['Back lever', 'Full back lever', 'hold', 'bar', 5, 'skill', ['back', 'shoulders', 'chest'], ['core', 'biceps'], 'SKL', 0, 'Corps tendu face au sol.', 'Straight body facing the floor.'],
    frog_stand: ['Frog stand', 'Frog stand', 'hold', 'none', 2, 'skill', ['shoulders', 'core'], ['forearms'], 'SKL', 0, 'Genoux sur les coudes, penche-toi.', 'Knees on elbows, lean forward.'],
    tuck_planche: ['Planche groupée', 'Tuck planche', 'hold', 'none', 4, 'skill', ['shoulders', 'core'], ['triceps', 'chest'], 'SKL', 0, 'Bras tendus, épaules en avant.', 'Straight arms, shoulders forward.'],
    adv_tuck_planche: ['Planche groupée avancée', 'Advanced tuck planche', 'hold', 'none', 5, 'skill', ['shoulders', 'core'], ['triceps', 'chest'], 'SKL', 0, 'Dos plat.', 'Flat back.'],
    straddle_planche: ['Planche écartée', 'Straddle planche', 'hold', 'none', 5, 'skill', ['shoulders', 'core', 'chest'], ['triceps'], 'SKL', 0, 'Jambes écartées à l’horizontale.', 'Legs apart, horizontal.'],
    wall_hs: ['Équilibre contre le mur', 'Wall handstand', 'hold', 'none', 2, 'handstand', ['shoulders'], ['core', 'triceps'], 'SKL', 0, 'Ventre vers le mur, corps aligné.', 'Chest to wall, body aligned.'],
    free_hs: ['Équilibre libre', 'Freestanding handstand', 'hold', 'none', 4, 'handstand', ['shoulders', 'core'], ['triceps', 'forearms'], 'SKL', 0, 'Corrige avec les doigts.', 'Balance with your fingers.'],
    // Cardio / HIIT
    burpee: ['Burpees', 'Burpees', 'reps', 'none', 2, 'hiit', ['quads', 'chest'], ['core', 'shoulders'], 'AGI', 0, 'Rythme constant.', 'Steady pace.'],
    mountain: ['Mountain climbers', 'Mountain climbers', 'time', 'none', 1, 'hiit', ['core'], ['shoulders', 'quads'], 'AGI', 0, 'Hanches basses, genoux rapides.', 'Hips low, fast knees.'],
    jumping_jack: ['Jumping jacks', 'Jumping jacks', 'time', 'none', 1, 'hiit', ['calves'], ['shoulders'], 'END', 0, 'Reste léger sur les pieds.', 'Stay light on your feet.'],
    high_knees: ['Montées de genoux', 'High knees', 'time', 'none', 1, 'hiit', ['quads'], ['core', 'calves'], 'AGI', 0, 'Genoux à hauteur des hanches.', 'Knees to hip height.'],
    jump_rope: ['Corde à sauter', 'Jump rope', 'time', 'none', 1, 'hiit', ['calves'], ['shoulders', 'forearms'], 'AGI', 0, 'Petits sauts sur l’avant du pied.', 'Small jumps on the balls of your feet.'],
    // Mobility
    cat_cow: ['Chat-vache', 'Cat-cow', 'time', 'none', 1, 'mobility', ['lowback'], ['core'], 'MOB', 0, 'Respire avec le mouvement.', 'Breathe with the movement.'],
    pigeon: ['Pigeon', 'Pigeon stretch', 'hold', 'none', 1, 'mobility', ['glutes'], [], 'MOB', 0, 'Hanches carrées.', 'Hips square.'],
    ham_stretch: ['Étirement ischios', 'Hamstring stretch', 'hold', 'none', 1, 'mobility', ['hamstrings'], [], 'MOB', 0, 'Dos long, pas arrondi.', 'Long back, not rounded.'],
    deep_squat: ['Squat profond tenu', 'Deep squat hold', 'hold', 'none', 1, 'mobility', ['quads', 'glutes'], ['calves'], 'MOB', 0, 'Talons au sol.', 'Heels down.'],
    shoulder_disl: ['Dislocations d’épaules', 'Shoulder dislocates', 'reps', 'band', 1, 'mobility', ['shoulders'], ['chest'], 'MOB', 0, 'Bras tendus, lentement.', 'Straight arms, slowly.'],
    couch: ['Étirement canapé', 'Couch stretch', 'hold', 'none', 1, 'mobility', ['quads'], ['glutes'], 'MOB', 0, 'Serre le fessier de la jambe arrière.', 'Squeeze the back leg’s glute.'],
  };
  const LIB = {};
  for (const [id, a] of Object.entries(L)) {
    LIB[id] = { id, fr: a[0], en: a[1], kind: a[2], eq: a[3], level: a[4], pattern: a[5], primary: a[6], secondary: a[7], attr: a[8], weighted: !!a[9], cueFr: a[10], cueEn: a[11] };
  }

  // Calisthenics skill tree: each branch is an ordered list of steps; a step is unlocked by a best set
  // (reps, seconds held, or kg added for weighted) on its exercise.
  const TREE = {
    push: { fr: 'Poussée', en: 'Push', steps: [['pushup_knee', 'reps', 15], ['pushup', 'reps', 10], ['pushup', 'reps', 25], ['pushup_diamond', 'reps', 12], ['pushup_archer', 'reps', 6], ['pushup_pseudo', 'reps', 10], ['pushup_onearm', 'reps', 3]] },
    dips: { fr: 'Dips', en: 'Dips', steps: [['dips_bench', 'reps', 15], ['dips', 'reps', 5], ['dips', 'reps', 15], ['dips', 'kg', 20], ['ring_dips', 'reps', 8]] },
    pull: { fr: 'Traction', en: 'Pull', steps: [['aus_row', 'reps', 12], ['pullup_neg', 'reps', 5], ['pullup', 'reps', 5], ['pullup', 'reps', 12], ['pullup', 'kg', 15], ['chest_to_bar', 'reps', 5], ['archer_pullup', 'reps', 4], ['muscle_up', 'reps', 1], ['muscle_up', 'reps', 5]] },
    core: { fr: 'Gainage', en: 'Core', steps: [['plank', 'hold', 60], ['hollow', 'hold', 30], ['hang_knee', 'reps', 12], ['lsit', 'hold', 10], ['lsit', 'hold', 30], ['toes_to_bar', 'reps', 8], ['dragon_flag', 'reps', 5], ['vsit', 'hold', 5]] },
    lever: { fr: 'Levers', en: 'Levers', steps: [['dead_hang', 'hold', 45], ['tuck_fl', 'hold', 10], ['adv_tuck_fl', 'hold', 10], ['straddle_fl', 'hold', 5], ['full_fl', 'hold', 3], ['tuck_bl', 'hold', 10], ['full_bl', 'hold', 5]] },
    planche: { fr: 'Planche', en: 'Planche', steps: [['frog_stand', 'hold', 20], ['pushup_pseudo', 'reps', 8], ['tuck_planche', 'hold', 10], ['adv_tuck_planche', 'hold', 8], ['straddle_planche', 'hold', 5]] },
    legs: { fr: 'Jambes', en: 'Legs', steps: [['squat_bw', 'reps', 25], ['bulgarian', 'reps', 12], ['pistol_assist', 'reps', 6], ['pistol', 'reps', 5], ['nordic', 'reps', 3], ['shrimp', 'reps', 5]] },
    handstand: { fr: 'Équilibre', en: 'Handstand', steps: [['pike_pushup', 'reps', 10], ['wall_hs', 'hold', 30], ['wall_hs', 'hold', 60], ['hspu_wall', 'reps', 3], ['free_hs', 'hold', 5], ['free_hs', 'hold', 20]] },
  };

  // Line icons (24×24, stroke = currentColor) used across the Sport UI instead of emojis
  const P = {
    dumbbell: '<path d="M2 12h2M20 12h2M6 8v8M18 8v8M4 10v4M20 10v4M6 12h12"/>',
    bar: '<path d="M3 5h18M7 5v3M17 5v3"/><circle cx="12" cy="11" r="2"/><path d="M8 8l2 3M16 8l-2 3M12 13v5M10 21l2-3 2 3"/>',
    body: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M7 9l5 2 5-2M9 21l3-7 3 7"/>',
    timer: '<circle cx="12" cy="13" r="7"/><path d="M12 13V9M10 2h4M18.5 6.5l1.5-1.5"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6.5 1 1 2 2 2 3.5 0-3 0-5 1-7z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    tree: '<circle cx="12" cy="4" r="2"/><circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/><circle cx="12" cy="20" r="2"/><path d="M11 6l-5 5M13 6l5 5M6.5 14.5l4.5 4M17.5 14.5l-4.5 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 9a5 5 0 0 1 7 0L12 12z"/>',
    water: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    moon: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z"/>',
    run: '<circle cx="14" cy="4" r="2"/><path d="M8 21l3-5 3 2v4M7 12l3-4 4 1 3 3 3 0M10 8l-2 4"/>',
    bike: '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-7h5l3 7M10 9l3 7M14 5h3"/>',
    swim: '<path d="M2 18c2 0 2 1.5 4 1.5S8 18 10 18s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><circle cx="16" cy="7" r="2"/><path d="M4 14l6-4 4 3 4-2"/>',
    walk: '<circle cx="12" cy="4" r="2"/><path d="M12 7l-1 6 3 3v5M11 13l-3 8M9 9l-2 4M13 9l3 3"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
    glove: '<path d="M7 10V7a3 3 0 0 1 6 0v1a3 3 0 0 1 6 2v4a6 6 0 0 1-6 6H10a3 3 0 0 1-3-3z"/><path d="M7 13h6"/>',
    lotus: '<path d="M12 20c-5 0-8-3-9-6 3 0 6 1 9 4 3-3 6-4 9-4-1 3-4 6-9 6z"/><path d="M12 18c-2-2-3-5-1-10 0 0 1-2 1-3 0 1 1 3 1 3 2 5 1 8-1 10z"/>',
    climb: '<path d="M5 21l5-9 4 3 5-11"/><circle cx="10" cy="12" r="1.5"/><circle cx="14" cy="15" r="1.5"/><circle cx="19" cy="4" r="1.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    home: '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    skip: '<path d="M5 5v14l9-7zM18 5v14"/>',
    minus: '<path d="M5 12h14"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || P.dumbbell}</svg>`;
  const ACT_ICON = { run: 'run', bike: 'bike', swim: 'swim', walk: 'walk', football: 'ball', basket: 'ball', tennis: 'ball', boxing: 'glove', climb: 'climb', yoga: 'lotus', dance: 'body', other: 'heart' };
  const TYPE_ICON = { strength: 'dumbbell', calisthenics: 'bar', cardio: 'run', hiit: 'bolt', sport: 'ball', mobility: 'lotus', home: 'home' };

  ML.SportData = { MUSCLES, EQUIP, ATTRS, LIB, TREE, icon, ACT_ICON, TYPE_ICON };
})();
