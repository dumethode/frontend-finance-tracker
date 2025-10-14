const KEY = 'alu:finance:data';

export function loadData(){
  const raw = localStorage.getItem(KEY);
  try{
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse saved data', e);
    return [];
  }
}

export function saveData(data){
  localStorage.setItem(KEY, JSON.stringify(data));
}