function unitOptionValue(allyType, datasheetId) {
  return JSON.stringify({ allyType, datasheetId });
}

function parseUnitOptionValue(value) {
  try {
    const parsed = JSON.parse(value);
    return {
      allyType: parsed.allyType || "native",
      datasheetId: parsed.datasheetId || "",
    };
  } catch {
    return { allyType: "native", datasheetId: value || "" };
  }
}

export { parseUnitOptionValue, unitOptionValue };
