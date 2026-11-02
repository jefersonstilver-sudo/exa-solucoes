/*
 * EXA · hora de Brasília na réplica da TV (só com ?tela=1).
 * TV box com Android/tzdata antigo ainda aplica o horário de verão (1º domingo de novembro) e a tela do elevador,
 * que usa a hora local do aparelho, fica 1 h adiantada. O Brasil não tem horário de verão desde 2019: aqui a hora
 * local da página passa a ser sempre UTC−3. Em aparelho com o fuso certo (offset 180), não faz nada.
 */
(function () {
  try {
    if (!/[?&]tela=1(&|$)/.test(location.search)) return;
    if (new Date().getTimezoneOffset() === 180) return;
    var D = Date.prototype, DESLOC = 3 * 3600 * 1000;
    var brt = function (d) { return new Date(d.getTime() - DESLOC); };
    ['FullYear', 'Month', 'Date', 'Day', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'].forEach(function (n) {
      var utc = D['getUTC' + n];
      D['get' + n] = function () { return utc.call(brt(this)); };
    });
    D.getTimezoneOffset = function () { return 180; };
    var fixo = function (fn) {
      return function (loc, op) {
        var o = {}; for (var k in (op || {})) o[k] = op[k];
        if (!o.timeZone || o.timeZone === 'America/Sao_Paulo') { o.timeZone = 'UTC'; return fn.call(brt(this), loc, o); }
        return fn.call(this, loc, o);
      };
    };
    D.toLocaleTimeString = fixo(D.toLocaleTimeString);
    D.toLocaleDateString = fixo(D.toLocaleDateString);
    D.toLocaleString = fixo(D.toLocaleString);
  } catch (e) { /* segue com a hora do aparelho */ }
})();
