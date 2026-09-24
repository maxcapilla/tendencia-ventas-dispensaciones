const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const element = { addEventListener() {} };
const context = vm.createContext({ document: {getElementById: () => element}, console, Intl, TextEncoder, TextDecoder });
vm.runInContext(script, context);
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  return {
    sales: { Rodoviario:{sales:100,dispensations:2,avg_ticket:50}, 'Von Schroeders':{sales:200,dispensations:2,avg_ticket:100}},
    inventory:{Rodoviario:10,'Von Schroeders':20}, isp:{with:2,without:0},
    products:{Rodoviario:2,'Von Schroeders':0},
    expiries:{counts:{Rodoviario:{},'Von Schroeders':{}}},
    pvmp:{Rodoviario:{'Sobre PVMP':1,'Fraccionado · pendiente normalizar':1},'Von Schroeders':{},
      detail:[{id:1,store:'Rodoviario',product:'A & <B>',isp:'F-1',sale:120,pvmp:100,diff:20,diff_pct:20,pvmp_status:'Sobre PVMP'}],
      pending:[{id:2,store:'Rodoviario',product:'#F Producto',isp:'F-2',sale:2,pvmp:100,pvmp_options:[100],diff:null,diff_pct:null,pvmp_status:'Fraccionado · pendiente normalizar'}]},
    cross:{rod_missing:1,vs_missing:1,rod_missing_medicines:1,vs_missing_medicines:0,
      detail:[{id:1,product:'A & <B>',product_class:'MEDICAMENTO',rod:-2,vs:5,type:'Sin stock Rodoviario'},
        {id:2,product:'B',product_class:'DISPOSITIVO MEDICO',rod:9,vs:0,type:'Sin stock Von Schroeders'}]}
  };
}
test('accepts complete detail, including negative stock', () => {
  assert.doesNotThrow(() => context.validatePanelDetails(fixture()));
});
test('rejects the original failure: nonzero summaries with empty detail', () => {
  for (const section of ['pvmp','cross']) {
    const data=fixture(); data[section].detail=[];
    assert.throws(() => context.validatePanelDetails(data));
  }
});
test('rejects truncated, duplicated, misclassified and invalid numeric records', () => {
  const changes=[
    d => d.cross.detail.pop(), d => d.cross.detail.push(d.cross.detail[0]),
    d => d.cross.detail[0].type='Sin stock Von Schroeders',
    d => d.cross.detail[0].rod=null, d => d.cross.rod_missing_medicines=0,
    d => d.pvmp.detail[0].pvmp=null, d => d.pvmp.detail[0].isp='',
    d => d.pvmp.detail[0].diff=0, d => d.pvmp.detail[0].diff_pct=0,
    d => d.pvmp.detail[0].pvmp_status='Bajo PVMP',
    d => d.pvmp.pending=[], d => d.pvmp.pending[0].diff=-98,
    d => d.pvmp.detail.push(clone(d.pvmp.detail[0])),
  ];
  for (const change of changes) { const data=fixture(); change(data); assert.throws(() => context.validatePanelDetails(data)); }
});
test('renders every row, escapes source text, and retains original document verbatim', () => {
  const historical='<html><head></head><body><main>Original historical chart</main><script>/* original */</script></body></html>';
  const rendered=context.enhanceHistoricalDashboard(historical,fixture());
  assert.ok(rendered.includes('<main>Original historical chart</main><script>/* original */</script>'));
  assert.ok(rendered.includes('A &amp; &lt;B&gt;'));
  assert.ok(!rendered.includes('A & <B>'));
  assert.ok(rendered.includes('data-pf-target="pf-cross-r"'));
  assert.ok(rendered.includes('data-pf-target="pf-cross-v"'));
  assert.equal((rendered.match(/<tbody>/g)||[]).length,4);
  assert.equal((rendered.match(/<tr><td>/g)||[]).length,4);
});
test('valid empty data displays explicit empty states', () => {
  const d=fixture(); d.pvmp={Rodoviario:{},'Von Schroeders':{},detail:[],pending:[]};
  d.products={Rodoviario:0,'Von Schroeders':0};
  d.cross={rod_missing:0,vs_missing:0,rod_missing_medicines:0,vs_missing_medicines:0,detail:[]};
  const result=context.enhanceHistoricalDashboard('<html><head></head><body></body></html>',d);
  assert.ok(result.includes('No hay productos comparables'));
  assert.equal((result.match(/No hay productos en esta situación/g)||[]).length,2);
});
test('protected historical payload is byte-identical to the pre-fix version', () => {
  const payload=html.match(/const protectedContent = (\{.*?\});/s)[1];
  assert.equal(crypto.createHash('sha256').update(payload).digest('hex'), '72e19dc3b9e96758aa3fed86e71c887a6938183a91ce77568c004ca385a90634');
});
test('published encrypted payload reconciles with its full detail', {skip:!process.env.PANEL_ACCESS_CODE}, () => {
  const p=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/panel-2026-09.json'),'utf8'));
  const key=crypto.pbkdf2Sync(process.env.PANEL_ACCESS_CODE.trim().toUpperCase(),Buffer.from(p.salt,'base64'),p.iterations,32,'sha256');
  const bytes=Buffer.from(p.ciphertext,'base64');
  const d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(p.iv,'base64'));
  d.setAuthTag(bytes.subarray(-16));
  const data=JSON.parse(Buffer.concat([d.update(bytes.subarray(0,-16)),d.final()]).toString());
  context.validatePanelDetails(data);
  assert.ok(data.pvmp.detail.length > 0);
  assert.ok(data.cross.detail.length > 0);
});
