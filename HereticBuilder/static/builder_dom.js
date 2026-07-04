function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function textNode(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  return node;
}

function button(className, text, onClick) {
  const node = document.createElement("button");
  node.className = className;
  node.type = "button";
  node.textContent = text;
  node.addEventListener("click", onClick);
  return node;
}

function link(className, text, href) {
  const node = document.createElement("a");
  node.className = className;
  node.textContent = text;
  node.href = href;
  return node;
}

function option(value, text) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = text;
  return node;
}

function field(label, control) {
  const node = document.createElement("label");
  node.className = "field";
  node.append(textNode("span", "", label), control);
  return node;
}

function metricLine(label, value) {
  const node = document.createElement("p");
  node.className = "metric-line";
  node.append(textNode("span", "", label), textNode("strong", "", value));
  return node;
}

export { button, clear, field, link, metricLine, option, textNode };
