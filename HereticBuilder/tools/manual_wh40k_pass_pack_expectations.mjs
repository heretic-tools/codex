import { validationConceptForCode } from "../../tests/builder_validation_concepts.mjs";

const manualMinimumSubchecks = {
  "heretic-astartes-daemon-allies-points": [
    "Legiones Daemonica Bloodletters under Strike Force ally points cap stays valid.",
    "Legiones Daemonica Bloodletters over Strike Force ally points cap emits allied_points.limit_exceeded.",
  ],
  "heretic-astartes-daemon-outnumbering": [
    "Khorne Bloodmaster without matching Bloodletters emits allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Khorne Bloodmaster with matching Bloodletters does not emit allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Nurgle Poxbringer without matching Plaguebearers emits allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Nurgle Poxbringer with matching Plaguebearers does not emit allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Slaanesh Infernal Enrapturess without matching Daemonettes emits allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Slaanesh Infernal Enrapturess with matching Daemonettes does not emit allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Tzeentch Changecaster without matching Pink Horrors emits allied_keyword_restricting_keyword.outnumbered_keywords.",
    "Tzeentch Changecaster with matching Pink Horrors does not emit allied_keyword_restricting_keyword.outnumbered_keywords.",
  ],
  "heretic-astartes-chaos-knights-cap": [
    "Three War Dog Brigands in a Heretic Astartes Strike Force roster do not emit allied_keyword_count.limit_exceeded.",
    "Four War Dog Brigands in a Heretic Astartes Strike Force roster exceed the Chaos Knights ally cap.",
    "Knight Rampager alone in a Heretic Astartes Strike Force roster does not emit allied_keyword_count.invalid_mutually_exclusive_keywords.",
    "War Dog Brigand plus Knight Rampager triggers the mutually exclusive Chaos Knights ally bucket diagnostic.",
  ],
  "heretic-astartes-cult-legion-detachment": [
    "Death Guard Plague Marines without a configured Heretic Astartes detachment emit allied_unit.required_detachment_not_selected.",
    "Death Guard Plague Marines with Pactbound Zealots selected do not emit allied_unit.required_detachment_not_selected.",
    "Thousand Sons Rubric Marines without a configured Heretic Astartes detachment emit allied_unit.required_detachment_not_selected.",
    "Thousand Sons Rubric Marines with Pactbound Zealots selected do not emit allied_unit.required_detachment_not_selected.",
    "World Eaters Khorne Berzerkers without a configured Heretic Astartes detachment emit allied_unit.required_detachment_not_selected.",
    "World Eaters Khorne Berzerkers with Pactbound Zealots selected do not emit allied_unit.required_detachment_not_selected.",
    "Emperor's Children Noise Marines without a configured Heretic Astartes detachment emit allied_unit.required_detachment_not_selected.",
    "Emperor's Children Noise Marines with Pactbound Zealots selected do not emit allied_unit.required_detachment_not_selected.",
  ],
  "heretic-astartes-titanicus-traitoris-cap": [
    "One Chaos Warhound Titan ally in a Heretic Astartes Strike Force roster does not emit allied_keyword_count.limit_exceeded.",
    "Two Chaos Warhound Titan allies in a Heretic Astartes Strike Force roster exceed the Titanicus Traitoris ally cap.",
  ],
  "adeptus-astartes-detachment-dp-overrides": [
    "Black Templars detachment point override changes the allowed DP total.",
    "Stormlance Task Force override is checked for Blood Angels, Deathwatch, and Black Templars.",
    "Bastion Task Force control case keeps the configured Adeptus Astartes child-faction DP behavior.",
  ],
  "adeptus-astartes-successor-epic-hero-conflict": [
    "A successor chapter roster containing a parent-faction Epic Hero emits roster.successor_chapter_epic_hero_in_roster.",
  ],
  "ynnari-devoted-of-ynnead-warlord": [
    "Devoted of Ynnead without Yvraine or the Yncarne as Warlord is invalid.",
    "Devoted of Ynnead with Yvraine as Warlord is valid.",
    "Devoted of Ynnead with the Yncarne as Warlord is valid.",
  ],
  "asuryani-ynnari-keyword-restrictions": [
    "Asuryani zero-limit keyword restriction applies in the non-Ynnari control roster.",
    "Ynnari/Devoted of Ynnead exception does not emit the Asuryani zero-limit diagnostic.",
  ],
  "drukhari-harlequin-character-limits": [
    "Drukhari roster with Harlequin Character allies at the configured limit is valid.",
    "Adding the Death Jester over-limit case emits keyword_restriction_group.limit_exceeded.",
  ],
  "enhancement-roster-limit": [
    "Enhancements at the battle-size roster cap are valid.",
    "Enhancements over the battle-size roster cap emit enhancement.roster_has_too_many_enhancements.",
  ],
  "enhancement-required-keyword-excluded-keyword-wargear": [
    "Enhancement requiring a keyword accepts a valid target and rejects a target missing that keyword.",
    "Enhancement excluding a keyword rejects a target with the excluded keyword.",
    "Enhancement requiring wargear accepts the equipped target and rejects the missing-wargear target.",
  ],
  "enhancement-disciple-of-khorne-warlord-target": [
    "Disciple of Khorne on the selected Warlord miniature emits warlord.invalid_due_to_enhancement.",
    "Disciple of Khorne on a non-Warlord miniature in the same unit does not invalidate the Warlord.",
  ],
  "attachment-valid-invalid-and-must-attach": [
    "Valid leader/bodyguard attachment is accepted.",
    "Duplicate attachment membership is invalid.",
    "Leader without bodyguard and support without bodyguard emit attached_unit.must_be_attached.",
    "Bodyguard without attached model emits attached_unit.incomplete.",
    "Invalid support/bodyguard requirement emits attached_unit.missing_requirements.",
  ],
  "allegiance-pactbound-mark-of-chaos": [
    "Pactbound Zealots Mark of Chaos missing selection emits allegiance_ability.not_selected.",
    "Multiple Mark of Chaos selections emit allegiance_ability.multiple_selected.",
    "Required-detachment scope is accepted only when the configured detachment is selected.",
  ],
  "allegiance-daemonic-required-wargear": [
    "Daemonic Allegiance ability requiring wargear rejects the missing-wargear target.",
    "The same Daemonic Allegiance ability accepts the equipped-wargear target.",
  ],
  "allegiance-roster-min-max-groups": [
    "Headhunter Task Force minimum allegiance group is invalid below the configured minimum and valid at minimum.",
    "Houndpack Lance maximum allegiance group is valid at limit and invalid over limit.",
  ],
};

const manualMinimumSubcheckSetupHints = {
  "heretic-astartes-daemon-allies-points": [
    "Roster: Heretic Astartes / Strike Force. Add Legiones Daemonica Bloodletters and keep total Legiones Daemonica ally points at or below the Strike Force 500 point cap.",
    "Roster: Heretic Astartes / Strike Force. Add enough Legiones Daemonica Bloodletters to push total Legiones Daemonica ally points above the Strike Force 500 point cap.",
  ],
  "heretic-astartes-daemon-outnumbering": [
    "Roster: Heretic Astartes / Strike Force. Add Bloodmaster without any Khorne Battleline daemon; keep unrelated Warlord/basic roster errors out of the observation if possible.",
    "Roster: Heretic Astartes / Strike Force. Add Bloodletters before or with Bloodmaster; check that the Khorne outnumbering diagnostic is absent.",
    "Roster: Heretic Astartes / Strike Force. Add Poxbringer without any Nurgle Battleline daemon; keep unrelated Warlord/basic roster errors out of the observation if possible.",
    "Roster: Heretic Astartes / Strike Force. Add Plaguebearers before or with Poxbringer; check that the Nurgle outnumbering diagnostic is absent.",
    "Roster: Heretic Astartes / Strike Force. Add Infernal Enrapturess without any Slaanesh Battleline daemon; keep unrelated Warlord/basic roster errors out of the observation if possible.",
    "Roster: Heretic Astartes / Strike Force. Add Daemonettes before or with Infernal Enrapturess; check that the Slaanesh outnumbering diagnostic is absent.",
    "Roster: Heretic Astartes / Strike Force. Add Changecaster without any Tzeentch Battleline daemon; keep unrelated Warlord/basic roster errors out of the observation if possible.",
    "Roster: Heretic Astartes / Strike Force. Add Pink Horrors before or with Changecaster; check that the Tzeentch outnumbering diagnostic is absent.",
  ],
  "heretic-astartes-chaos-knights-cap": [
    "Roster: Heretic Astartes / Strike Force. Add three Chaos Knights War Dog Brigands; the Chaos Knights War Dog keyword limit is 3, so the limit diagnostic should be absent.",
    "Roster: Heretic Astartes / Strike Force. Add four Chaos Knights War Dog Brigands; the Chaos Knights War Dog keyword limit is 3.",
    "Roster: Heretic Astartes / Strike Force. Add one Chaos Knights Knight Rampager with no War Dog ally; the mutually exclusive keyword diagnostic should be absent.",
    "Roster: Heretic Astartes / Strike Force. Add one War Dog Brigand and one Knight Rampager; Chaos Knights ally keywords are mutually exclusive.",
  ],
  "heretic-astartes-cult-legion-detachment": [
    "Roster: Heretic Astartes / Strike Force. Add Death Guard Plague Marines with no detachment selected.",
    "Roster: Heretic Astartes / Strike Force. Add Death Guard Plague Marines with Pactbound Zealots selected (3 DP / Priority Assets).",
    "Roster: Heretic Astartes / Strike Force. Add Thousand Sons Rubric Marines with no detachment selected.",
    "Roster: Heretic Astartes / Strike Force. Add Thousand Sons Rubric Marines with Pactbound Zealots selected (3 DP / Priority Assets).",
    "Roster: Heretic Astartes / Strike Force. Add World Eaters Khorne Berzerkers with no detachment selected.",
    "Roster: Heretic Astartes / Strike Force. Add World Eaters Khorne Berzerkers with Pactbound Zealots selected (3 DP / Priority Assets).",
    "Roster: Heretic Astartes / Strike Force. Add Emperor's Children Noise Marines with no detachment selected.",
    "Roster: Heretic Astartes / Strike Force. Add Emperor's Children Noise Marines with Pactbound Zealots selected (3 DP / Priority Assets).",
  ],
  "heretic-astartes-titanicus-traitoris-cap": [
    "Roster: Heretic Astartes / Strike Force. Add one Titanicus Traitoris Chaos Warhound Titan; Warhound Titan ally limit is 1, so the limit diagnostic should be absent.",
    "Roster: Heretic Astartes / Strike Force. Add two Titanicus Traitoris Chaos Warhound Titans; Warhound Titan ally limit is 1.",
  ],
  "adeptus-astartes-detachment-dp-overrides": [
    "Roster: Black Templars / Strike Force. Add Stormlance Task Force and Bastion Task Force; Builder expects 5 DP against the Black Templars override, exceeding the 3 DP cap.",
    "Roster: compare Blood Angels, Deathwatch, and Black Templars / Strike Force with Stormlance Task Force; official app should apply the child-faction 2 DP override instead of the Adeptus Astartes 3 DP base cost.",
    "Roster: compare Adeptus Astartes and Black Templars / Strike Force with Bastion Task Force; official app should keep the generic 2 DP cost for Adeptus Astartes and use the Black Templars 3 DP override.",
  ],
  "adeptus-astartes-successor-epic-hero-conflict": [
    "Roster: Imperial Fists successor context. Invalid state: include Pedro Kantor and Tor Garadon together. Valid control: include Pedro Kantor with Marneus Calgar instead.",
  ],
  "ynnari-devoted-of-ynnead-warlord": [
    "Roster: Asuryani / Strike Force with Devoted of Ynnead. Select Farseer as Warlord; official app should reject because Yvraine or the Yncarne is mandatory.",
    "Roster: Asuryani / Strike Force with Devoted of Ynnead. Select Yvraine as Warlord; official app should accept the mandatory Warlord requirement.",
    "Roster: Asuryani / Strike Force with Devoted of Ynnead. Select the Yncarne as Warlord; official app should accept the mandatory Warlord requirement.",
  ],
  "asuryani-ynnari-keyword-restrictions": [
    "Roster: Asuryani / Strike Force without Devoted of Ynnead/Ynnari context. Add the Yncarne/Epic Hero case from the Builder fixture; expect keyword_restriction_group.limit_zero.",
    "Roster: Asuryani / Strike Force with Ynnari/Devoted of Ynnead context. Add the same Yncarne/Epic Hero case; expect no Asuryani zero-limit diagnostic.",
  ],
  "drukhari-harlequin-character-limits": [
    "Roster: Drukhari / Strike Force. Add one Death Jester Harlequin Character ally; official app should keep the roster valid at the configured limit.",
    "Roster: Drukhari / Strike Force. Add a second Death Jester Harlequin Character ally; official app should emit keyword_restriction_group.limit_exceeded.",
  ],
  "enhancement-roster-limit": [
    "Roster: Chaos Knights / Strike Force with Lords of Dread. Add four Knight Desecrator models with distinct enhancements; this is at the battle-size enhancement cap.",
    "Roster: Chaos Knights / Strike Force with Lords of Dread. Add five distinct Lords of Dread enhancements across Knight Desecrator models; expect enhancement.roster_has_too_many_enhancements.",
  ],
  "enhancement-required-keyword-excluded-keyword-wargear": [
    "Roster: Adeptus Astartes / Strike Force with Librarius Conclave. Valid target: Librarian with Fusillade. Invalid target: Captain with Fusillade lacks the required keyword.",
    "Roster: Heretic Astartes / Strike Force with Fellhammer Siege-host. Put Bastion Plate on Chaos Lord with Jump Pack; expect excluded-keyword rejection.",
    "Roster: Leagues of Votann / Strike Force with the required-wargear enhancement fixture. Equip the required wargear for the valid control, then remove it for the missing-wargear rejection.",
  ],
  "enhancement-disciple-of-khorne-warlord-target": [
    "Roster: World Eaters / Strike Force with Khorne Daemonkin. Put Disciple of Khorne on the selected Warlord miniature in the two-model fixture; expect warlord.invalid_due_to_enhancement.",
    "Roster: World Eaters / Strike Force with Khorne Daemonkin. Put Disciple of Khorne on the non-Warlord miniature in the same unit; official app should keep the Warlord valid.",
  ],
  "attachment-valid-invalid-and-must-attach": [
    "Roster: use the Builder attachment fixture. Attach Leader to Bodyguard in one attachment group; official app should accept the pair.",
    "Roster: use the Builder attachment fixture. Put the same unit in duplicate attachment membership; official app should reject the duplicate membership.",
    "Roster: use the Builder attachment fixture. Create leader-only and support-only attachment groups with no bodyguard; official app should emit attached_unit.must_be_attached.",
    "Roster: use the Builder attachment fixture. Create a bodyguard-only group with no attached model; official app should emit attached_unit.incomplete.",
    "Roster: use the Builder attachment fixture. Attach Support or Leader to Wrong Bodyguard instead of the required Bodyguard datasheet; official app should emit attached_unit.missing_requirements.",
  ],
  "allegiance-pactbound-mark-of-chaos": [
    "Roster: Heretic Astartes / Strike Force with Pactbound Zealots. Add a unit that requires Mark of Chaos and leave the Mark unselected; expect allegiance_ability.not_selected.",
    "Roster: Heretic Astartes / Strike Force with Pactbound Zealots. Select two Marks of Chaos, for example Khorne and Nurgle, on the same unit; expect allegiance_ability.multiple_selected.",
    "Roster: Heretic Astartes / Strike Force. Select a Mark of Chaos while Pactbound Zealots is not selected; expect required-detachment scope rejection.",
  ],
  "allegiance-daemonic-required-wargear": [
    "Roster: Legiones Daemonica / Strike Force. Select Daemonic Allegiance: Khorne on the fixture unit while the required wargear item is absent; expect allegiance_ability.missing_wargear_item.",
    "Roster: Legiones Daemonica / Strike Force. Select Daemonic Allegiance: Khorne on the same fixture unit after equipping the required wargear item; official app should accept it.",
  ],
  "allegiance-roster-min-max-groups": [
    "Roster: Space Wolves / Strike Force with Houndpack Lance. Select the Houndpack Lance Character allegiance ability on two units; expect group_limit_not_reached because the minimum is not met.",
    "Roster: Space Wolves / Strike Force with Headhunter Task Force. Select the Headhunter Task Force Character allegiance ability on four units; expect group_limit_exceeded.",
  ],
};

function conceptsForCodes(codes, conceptByCode = {}) {
  return [...new Set((codes || []).map((code) => (
    conceptByCode[code] || validationConceptForCode(code) || "unmapped"
  )))];
}

function codeList(codes) {
  return codes?.length ? codes.join(", ") : "none";
}

function conceptList(codes, conceptByCode = {}) {
  const concepts = conceptsForCodes(codes, conceptByCode);
  return concepts.length ? concepts.join(", ") : "none";
}

function builderExpectation(codes, expectedState = "") {
  const normalizedExpectedState = String(expectedState || "").trim().toLowerCase();
  const codesText = codeList(codes);
  if (normalizedExpectedState) {
    return codesText === "none"
      ? normalizedExpectedState
      : `${normalizedExpectedState}: ${codesText}`;
  }
  return codesText === "none"
    ? "valid / no diagnostics"
    : `valid controls + invalid diagnostics: ${codesText}`;
}

function diagnosticFromSubcheck(codes, subcheck) {
  const text = String(subcheck || "");
  const lower = text.toLowerCase();
  const explicitCode = text.match(/[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+/i)?.[0];
  if (explicitCode) {
    return explicitCode;
  }
  if (lower.includes("mutually exclusive")) {
    const mutuallyExclusiveCode = codes?.find((code) => code.includes("invalid_mutually_exclusive"));
    if (mutuallyExclusiveCode) {
      return mutuallyExclusiveCode;
    }
  }
  if (/\b(?:cap|limit|exceeds?|over-limit)\b/.test(lower)) {
    const limitCode = codes?.find((code) => code.includes("limit_exceeded"));
    if (limitCode) {
      return limitCode;
    }
  }
  if (lower.includes("detachment")) {
    const detachmentCode = codes?.find((code) => code.includes("detachment"));
    if (detachmentCode) {
      return detachmentCode;
    }
  }
  if (codes?.length === 1) {
    return codes[0];
  }
  return codeList(codes);
}

function subcheckExpectedObservation(codes, subcheck) {
  const text = String(subcheck || "");
  const lower = text.toLowerCase();
  const diagnostic = diagnosticFromSubcheck(codes, subcheck);
  const hasDiagnostic = diagnostic && diagnostic !== "none";
  const isAbsentDiagnostic = /\b(?:does not|do not) emit\b/.test(lower);
  const isPresentDiagnostic = /\bemits?\b/.test(lower);
  const isValidState = isAbsentDiagnostic ||
    /\bstays valid\b/.test(lower) ||
    /\bis valid\b/.test(lower) ||
    /\bare valid\b/.test(lower) ||
    /\bis accepted\b/.test(lower) ||
    /\baccepted\b/.test(lower) ||
    /\baccepts\b/.test(lower) ||
    /\bdoes not invalidate\b/.test(lower) ||
    /\bvalid at\b/.test(lower) ||
    /\bat the configured limit is valid\b/.test(lower);
  const isInvalidState = isPresentDiagnostic ||
    /\bis invalid\b/.test(lower) ||
    /\bare invalid\b/.test(lower) ||
    /\binvalid below\b/.test(lower) ||
    /\binvalid over\b/.test(lower) ||
    /\brejects?\b/.test(lower) ||
    /\bexceeds?\b/.test(lower) ||
    /\btriggers?\b/.test(lower) ||
    /\bover-limit\b/.test(lower) ||
    /\bmissing\b/.test(lower) ||
    /\blacks\b/.test(lower);

  if (isValidState) {
    return {
      diagnostic: hasDiagnostic ? `absent: ${diagnostic}` : "none",
      state: "valid",
    };
  }
  if (isInvalidState) {
    return {
      diagnostic: hasDiagnostic ? `present: ${diagnostic}` : "compare with Builder diagnostic",
      state: "invalid",
    };
  }
  return {
    diagnostic: hasDiagnostic ? `compare: ${diagnostic}` : "compare with Builder expectation",
    state: "compare",
  };
}

function subchecksForMinimumCase(caseId) {
  return manualMinimumSubchecks[caseId] || [];
}

function setupHintsForMinimumCase(caseId) {
  return manualMinimumSubcheckSetupHints[caseId] || [];
}

function subcheckList(subchecks) {
  return subchecks?.length ? subchecks.join("\n") : "none";
}

export {
  builderExpectation,
  conceptList,
  conceptsForCodes,
  manualMinimumSubcheckSetupHints,
  manualMinimumSubchecks,
  setupHintsForMinimumCase,
  subcheckExpectedObservation,
  subcheckList,
  subchecksForMinimumCase,
};
