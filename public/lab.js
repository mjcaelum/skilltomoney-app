/* Each run uses a fresh namespace; a failed run never changes the preview. */
function pythonWorker() {
  let pyodide;
  onmessage = async ({ data }) => {
    try {
      if (!pyodide) {
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
        pyodide = await loadPyodide();
        postMessage({ ready: true });
        return;
      }
      pyodide.globals.set('_source', data.code);
      pyodide.globals.set('_values_json', JSON.stringify(data.values));
      const result = await pyodide.runPythonAsync(`
import ast, contextlib, io, json, traceback
_values = iter(json.loads(_values_json))
_prompts = []
def _input(prompt=""):
    _prompts.append(str(prompt))
    try:
        return str(next(_values))
    except StopIteration:
        raise EOFError("연결된 입력 칸이 없습니다")
_out = io.StringIO()
_ns = {"input": _input, "__name__": "__main__"}
try:
    with contextlib.redirect_stdout(_out):
        exec(compile(_source, "<student>", "exec"), _ns)
    _variables = {}
    for _key, _value in _ns.items():
        if not _key.startswith("_") and _key != "input":
            try:
                json.dumps(_value, ensure_ascii=False, allow_nan=False)
                _variables[_key] = _value
            except (TypeError, ValueError, OverflowError):
                pass
    _result = {"ok": True, "output": _out.getvalue(), "variables": _variables, "prompts": _prompts}
except Exception as _error:
    _frames = [f for f in traceback.extract_tb(_error.__traceback__) if f.filename == "<student>"]
    _line = getattr(_error, "lineno", None) or (_frames[-1].lineno if _frames else 1)
    _result = {"ok": False, "type": type(_error).__name__, "line": _line, "detail": str(_error)}
json.dumps(_result, ensure_ascii=False)
`);
      postMessage(JSON.parse(result));
    } catch (error) { postMessage({ fatal: String(error) }); }
  };
}

const config = window.labConfig;
const $ = id => document.getElementById(id);
const editor = $('code'), status = $('status'), result = $('result');
editor.value = config.code;
let worker, timeout, lastSnapshot, lastVariables = {}, ready = false;
const connected = config.chapter === 2 ? ['cname', 'price'] : config.chapter === 3 ? ['price','seat','booked'] : config.chapter === 5 ? ['only_open'] : [];
const warning = '코드는 바르게 실행되었지만 왼쪽 웹앱에서 달라진 것이 없습니다. 파이썬 문법이 틀린 것이 아니라, 이 실습실에서 그 부분이 웹앱과 연결되어 있지 않을 뿐입니다. [⬇ 코랩 노트북으로 받기]로 코드를 받아 코랩에서 실행해 결과를 확인해 보세요.';
function message(text, kind = '') { status.textContent = text; status.className = `status ${kind}`; }
function buttons(disabled) { document.querySelectorAll('[data-run]').forEach(button => button.disabled = disabled); }
function numbers() { $('numbers').textContent = editor.value.split('\n').map((_, i) => i + 1).join('\n'); }
editor.addEventListener('input', numbers);
editor.addEventListener('scroll', () => $('numbers').scrollTop = editor.scrollTop);
editor.addEventListener('keydown', event => {
  if(event.key === 'Tab') { event.preventDefault(); editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end'); numbers(); }
});
numbers();
function showPreview(data) {
  const vars = data.variables;
  result.textContent = data.output.trimEnd();
  data.prompts.forEach((prompt, i) => { const label = $(`label${i}`); if(label) { label.textContent = prompt.replace(/[:：]\s*$/, ''); label.parentElement.querySelector('input').setAttribute('aria-label',label.textContent); } });
  if (config.chapter <= 3) {
    if (config.chapter === 2 && typeof vars.cname === 'string') $('courseName').textContent = `${vars.cname} 원데이 강좌`;
    if (typeof vars.price === 'number') $('price').textContent = `${vars.price.toLocaleString('ko-KR')}원`;
    if (config.chapter === 3) $('seats').textContent = `정원 ${vars.seat ?? '—'}명 · 이미 예약 ${vars.booked ?? '—'}명`;
  }
  if (config.chapter === 4 || config.chapter === 5) {
    result.textContent = '';
    for (const line of data.output.trim().split('\n').filter(Boolean)) {
      const card = document.createElement('article'); card.className = 'card';
      const match = line.match(/^(.*?) (\d+) 원 \/ 남은 자리/);
      if (match) { const name = document.createElement('strong'); name.textContent = match[1]; card.append(name, document.createElement('br'), line.slice(match[1].length).trim()); }
      else card.textContent = line;
      if (line.includes('[마감 임박]')) card.classList.add('error');
      if (line.includes('[마감]')) card.classList.add('muted');
      result.append(card);
    }
    if (config.chapter === 5) $('onlyOpen').checked = Boolean(vars.only_open);
  }
  if (config.chapter === 6 && Array.isArray(vars.row)) {
    const tr = document.createElement('tr');
    for (const value of vars.row) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }
    $('rows').append(tr);
  }
}
function start() {
  ready = false; buttons(true); message('파이썬을 준비하고 있습니다...');
  const url = URL.createObjectURL(new Blob([`(${pythonWorker.toString()})()`], {type:'text/javascript'}));
  worker = new Worker(url); URL.revokeObjectURL(url);
  worker.onerror = () => { clearTimeout(timeout); message('파이썬을 준비하지 못했습니다. 인터넷 연결을 확인한 뒤 페이지를 새로 고침해 주세요.', 'error'); };
  worker.onmessage = ({ data }) => {
    clearTimeout(timeout);
    if (data.ready) { ready = true; buttons(false); message('파이썬 준비 완료'); if(config.chapter !== 6) run(); return; }
    buttons(false);
    if (data.fatal) { message('실행 환경 오류입니다. 페이지를 새로 고침해 주세요.', 'error'); return; }
    if (!data.ok) {
      if (['EOFError','ModuleNotFoundError','ImportError'].includes(data.type)) { message(`웹앱과 연결되지 않은 입력 또는 모듈입니다. ${data.detail}\n${warning}`, 'warning'); return; }
      const errors = { SyntaxError:['문법 오류','괄호, 따옴표, 콜론을 확인하세요'], NameError:['이름 오류','변수 이름의 철자가 맞는지 확인하세요'], TypeError:['자료형 오류','숫자와 글자를 함께 계산하고 있지 않은지 확인하세요'], ValueError:['값 오류','숫자로 바꿀 수 있는 값을 입력하세요'], IndentationError:['들여쓰기 오류','같은 블록의 들여쓰기 칸 수를 맞추세요'] };
      const [title, help] = errors[data.type] || ['실행 오류', data.detail];
      message(`${data.line}번째 줄 ${title}: ${help}`, 'error'); return;
    }
    const snapshot = JSON.stringify({ output:data.output, prompts:data.prompts, values:connected.map(name=>data.variables[name]) });
    const changed = Object.keys(data.variables).filter(name => JSON.stringify(data.variables[name]) !== JSON.stringify(lastVariables[name]));
    const unchanged = config.chapter !== 6 && snapshot === lastSnapshot;
    showPreview(data); lastSnapshot = snapshot; lastVariables = data.variables;
    message(unchanged ? `${warning}\n바뀐 변수: ${changed.join(', ') || '없음'}` : '✔ 파이썬 코드가 웹앱에 적용되었습니다.', unchanged ? 'warning' : 'success');
  };
  worker.postMessage({});
}
function run() {
  if (!ready) return;
  buttons(true); message('실행 중...');
  worker.postMessage({code:editor.value, values:[...document.querySelectorAll('[data-input]')].map(input=>input.value)});
  timeout = setTimeout(() => { worker.terminate(); message('실행 시간이 10초를 넘었습니다. 반복문의 종료 조건을 확인하세요. [처음 코드로]를 누르면 다시 준비합니다.', 'error'); ready=false; }, 10000);
}
document.querySelectorAll('[data-run]').forEach(button => button.onclick = run);
$('reset').onclick = () => { editor.value = config.code; numbers(); if(!ready) start(); else message('처음 코드로 되돌렸습니다. 적용하기를 눌러 주세요.'); };
$('download').onclick = () => {
  const name = `ch${String(config.chapter).padStart(2,'0')}_lab.ipynb`;
  const notebook = {nbformat:4,nbformat_minor:4,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python'}},cells:[{cell_type:'markdown',metadata:{},source:[`${config.chapter}장 실습실에서 고친 코드입니다. 셀을 실행하면 ${config.chapter===6?'이름과 인원':config.chapter<=3?'인원':'코드의 결과'} ${config.chapter<=3||config.chapter===6?'입력 칸이 나타납니다':'가 표시됩니다'}.`]},{cell_type:'code',execution_count:null,metadata:{},outputs:[],source:editor.value.split('\n').map((line,i,lines)=>line+(i<lines.length-1?'\n':''))}]};
  const url=URL.createObjectURL(new Blob([JSON.stringify(notebook,null,2)],{type:'application/x-ipynb+json'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  message(`✔ ${name}를 내려받았습니다. 코랩 [파일] → [노트북 업로드]로 여세요.`, 'success');
};
start();
