module.exports = {
  source: {
    file: 'Base_Maestra_EGM_Actualizada_2026-09-26.xlsx',
    workbookDate: '2026-09-26',
    note: 'Las cantidades están agrupadas por cliente, sala y modelo. No hay números de serie.'
  },
  installations: [
    {sourceRow:2, client:'Casino Club', location:'Casino Club Santa Rosa', province:'La Pampa', model:'FV330C', quantity:4, package:'Diamond', signage:'Radiant 4P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:3, client:'Hipódromo Argentino de Palermo', location:'Palermo', province:'CABA', model:'FV330C', quantity:14, package:'Diamond', signage:'2× Radiant 4P0D + 1× Radiant 6P0D', islands:3, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:4, client:'Boldt S.A.', location:'Puerto Santa Fe', province:'Santa Fe', model:'FV330C', quantity:8, package:'Diamond', signage:'Radiant 4P0D ×2', islands:2, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:5, client:'City Center Rosario', location:'Rosario', province:'Santa Fe', model:'FV330C', quantity:12, package:'Diamond', signage:'Radiant 4P0D ×3', islands:3, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:'3 islas de 4'},
    {sourceRow:6, client:'Boldt S.A.', location:'Melincué', province:'Santa Fe', model:'FV330C', quantity:4, package:'Diamond', signage:'Radiant 4P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:7, client:'GoldenJack', location:'Quilmes', province:'Buenos Aires', model:'FV330C', quantity:6, package:'Diamond', signage:'Radiant 6P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:8, client:'Codere', location:'San Martín', province:'Buenos Aires', model:'FV330C', quantity:4, package:'Diamond', signage:'Radiant 4P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'2026-08-20', notes:''},
    {sourceRow:9, client:'Trilenium', location:'Tigre', province:'Buenos Aires', model:'FV330C', quantity:10, package:'Diamond', signage:'6P0D + 4P0D', islands:2, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:10, client:'Casino Magic', location:'Neuquén', province:'Neuquén', model:'FV330C', quantity:6, package:'Diamond', signage:'Radiant 6P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:11, client:'Grupo AGG', location:'Florencio Varela', province:'Buenos Aires', model:'FV838 CB', quantity:8, package:'Sin paquete', signage:'Sin cartel', islands:'', game:'Globe Link: Extension', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:12, client:'Grupo AGG', location:'Wilde', province:'Buenos Aires', model:'FV838 CB', quantity:8, package:'Sin paquete', signage:'Sin cartel', islands:'', game:'Globe Link: Extension', linked:'Sí', status:'Operativa', date:'', notes:''},
    {sourceRow:13, client:'Casino Buenos Aires', location:'Puerto Madero / CABA', province:'CABA', model:'FV838 CB', quantity:8, package:'Sin paquete', signage:'Sin cartel', islands:2, game:'Globe Link: Extension', linked:'Sí', status:'Operativa', date:'', notes:'2 islas de 4; un solo progresivo'},
    {sourceRow:14, client:'Casino Buenos Aires', location:'Puerto Madero / CABA', province:'CABA', model:'FV330C', quantity:4, package:'Diamond', signage:'Radiant 4P0D', islands:1, game:'Xtension Link: Evolution', linked:'Sí', status:'Operativa', date:'2026-09-17', notes:''}
  ],
  assignments: [
    {sourceId:'STK-001', client:'Hotelera Emprender S.A.', model:'FV834 FF2', quantity:8, game:'Impera Link Series 1', signage:'', linked:'', location:'TBD', date:'TBD', status:'Asignado / pendiente de instalación', notes:'Sala y fecha TBD'},
    {sourceId:'STK-002', client:'Hotelera Emprender S.A.', model:'FV640C FF2', quantity:8, game:'Ultra Boost o Cash Connection Edition 3', signage:'', linked:'', location:'TBD', date:'TBD', status:'Asignado / pendiente de instalación', notes:'Juego por confirmar; sala y fecha TBD'},
    {sourceId:'STK-003', client:'Hotelera Emprender S.A.', model:'FV838 CB', quantity:6, game:'Xtension Link Ultimate', signage:'Fazi', linked:'Sí', location:'TBD', date:'TBD', status:'Asignado / pendiente de instalación', notes:'Fecha de instalación TBD'}
  ],
  stockEgm: [
    {sourceId:'STK-004', model:'FV834', quantity:8, status:'Stock sin destino', condition:'', destination:'', game:'', signage:'', linked:'', notes:'Bank of 8', sourceClass:'EGM'},
    {sourceId:'STK-005', model:'FV837E', quantity:24, preparationQuantity:8, noDestinationQuantity:16, status:'Stock / preparación', condition:'', destination:'', game:'Xtension Link Evolution o Superia WinWays', signage:'Fazi', linked:'', notes:'Pack Ruby: 8 en preparación y 16 sin destino; configuración final pendiente', sourceClass:'EGM'},
    {sourceId:'STK-008', model:'V.I.P. X Galaxy 2.65', quantity:20, status:'Nuevo ingreso a stock', condition:'', destination:'', game:'', signage:'', linked:'', notes:'La hoja Stock_General la clasifica como Gaming cabinet; Resumen la cuenta como EGM', sourceClass:'Gaming cabinet'},
    {sourceId:'STK-009', model:'FV610', quantity:100, status:'Nuevo ingreso a stock', condition:'Refurbished', destination:'', game:'', signage:'', linked:'', notes:'', sourceClass:'EGM'}
  ],
  nonEgm: [
    {sourceId:'STK-006', model:'FV831 Kambi', category:'Terminal de apuestas', quantity:1, status:'Stock sin destino'},
    {sourceId:'STK-007', model:'NCM 100', category:'ATM', quantity:1, status:'Stock sin destino'}
  ],
  upgrades: [
    {id:'UPG-001', client:'Casino Club', model:'FV640C', quantity:8, from:'FF2 (FireFox II)', to:'CB (Cobra)', game:'Rising Treasures', linked:'Sí', type:'Upgrade / Actualización de plataforma', date:'2026-09-23', status:'Finalizado', notes:'Máquinas ya instaladas en cliente; no son máquinas nuevas'}
  ]
};
