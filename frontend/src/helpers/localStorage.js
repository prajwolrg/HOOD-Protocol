export function saveToLocalStorage(key, value) {
	localStorage.setItem(key, value)
}

export function loadFromLocalStorage(key) {
    localStorage.getItem(key)
}