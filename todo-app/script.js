// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let tasks = [];
let currentDate = new Date();
let selectedDate = new Date();
let currentFilter = 'all';
let currentCategoryFilter = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    initCalendar();
    renderTasks();
    renderReminders();
    renderStats();
    renderUpcoming();
    setupEventListeners();
    setupMobileNav();
    startReminderCheck();
});

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadAllData() {
    // Загрузка задач
    const storedTasks = localStorage.getItem('planner-tasks');
    tasks = storedTasks ? JSON.parse(storedTasks) : [];

    // Загрузка заметок
    const storedNotes = localStorage.getItem('planner-notes');
    if (storedNotes) {
        document.getElementById('notes-area').value = storedNotes;
    }
}

function saveAllData() {
    localStorage.setItem('planner-tasks', JSON.stringify(tasks));
}

// ==================== КАЛЕНДАРЬ ====================
function initCalendar() {
    renderCalendar();
    
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    document.getElementById('current-month').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Пн = 0

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && 
                           today.getFullYear() === currentDate.getFullYear();

    // Пустые ячейки до первого дня
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        calendarDays.appendChild(empty);
    }

    // Дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;

        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        
        // Сегодня
        if (isCurrentMonth && day === today.getDate()) {
            dayEl.classList.add('today');
        }

        // Выбранный день
        if (checkDate.toDateString() === selectedDate.toDateString()) {
            dayEl.classList.add('selected');
        }

        // Есть задачи
        const hasTasks = tasks.some(t => {
            const taskDate = new Date(t.date);
            return taskDate.toDateString() === checkDate.toDateString() && !t.completed;
        });
        if (hasTasks) {
            dayEl.classList.add('has-tasks');
        }

        dayEl.addEventListener('click', () => {
            selectedDate = checkDate;
            renderCalendar();
            filterByDate(checkDate);
        });

        calendarDays.appendChild(dayEl);
    }
}

function filterByDate(date) {
    currentFilter = 'selected';
    renderTasks();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ==================== ЗАДАЧИ ====================
function setupEventListeners() {
    // Добавление задачи
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentCategoryFilter = null;
            document.querySelectorAll('.category-filter').forEach(c => c.classList.remove('active'));
            renderTasks();
        });
    });

    // Фильтры по категориям
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            if (currentCategoryFilter === category) {
                currentCategoryFilter = null;
                btn.classList.remove('active');
            } else {
                document.querySelectorAll('.category-filter').forEach(c => c.classList.remove('active'));
                currentCategoryFilter = category;
                btn.classList.add('active');
            }
            renderTasks();
        });
    });

    // Сохранение заметок
    document.getElementById('save-notes').addEventListener('click', saveNotes);

    // Модальное окно
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('save-edit-btn').addEventListener('click', saveEdit);
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-modal') closeModal();
    });

    // Установка минимальной даты
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').min = today;
    document.getElementById('edit-task-date').min = today;
}

function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();

    if (text === '') {
        alert('Введите название задачи!');
        return;
    }

    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const reminder = document.getElementById('task-reminder').checked;

    const task = {
        id: Date.now(),
        text,
        category,
        priority,
        date: date || new Date().toISOString().split('T')[0],
        time,
        reminder,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveAllData();
    renderTasks();
    renderCalendar();
    renderReminders();
    renderStats();
    renderUpcoming();

    input.value = '';
    document.getElementById('task-date').value = '';
    document.getElementById('task-time').value = '';
    document.getElementById('task-reminder').checked = false;
}

function renderTasks() {
    const container = document.getElementById('tasks-column');
    container.innerHTML = '';

    let filtered = filterTasks();

    // Сортировка по приоритету и дате
    filtered.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.date) - new Date(b.date);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>Нет задач</h3>
                <p>Добавьте первую задачу!</p>
            </div>
        `;
        updateStats();
        return;
    }

    filtered.forEach(task => {
        const taskEl = createTaskElement(task);
        container.appendChild(taskEl);
    });

    updateStats();
}

function filterTasks() {
    let filtered = [...tasks];

    // Фильтр по категории
    if (currentCategoryFilter) {
        filtered = filtered.filter(t => t.category === currentCategoryFilter);
    }

    // Фильтр по статусу
    if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date === today && !t.completed);
    } else if (currentFilter === 'week') {
        const today = new Date();
        const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate <= weekLater && !t.completed;
        });
    } else if (currentFilter === 'selected') {
        const selected = selectedDate.toISOString().split('T')[0];
        filtered = filtered.filter(t => t.date === selected && !t.completed);
    } else {
        filtered = filtered.filter(t => !t.completed);
    }

    return filtered;
}

function createTaskElement(task) {
    const li = document.createElement('div');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    const categoryNames = {
        work: '💼 Работа',
        home: '🏠 Дом',
        study: '📚 Учёба',
        personal: '👤 Личное',
        health: '❤️ Здоровье',
        other: '📌 Другое'
    };

    const priorityNames = {
        low: '🟢 Низкий',
        medium: '🟡 Средний',
        high: '🔴 Высокий',
        urgent: '⚡ Срочно'
    };

    const dateObj = new Date(task.date);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
            <div class="task-text">${escapeHtml(task.text)}</div>
            <div class="task-meta">
                <span class="task-category ${task.category}">${categoryNames[task.category]}</span>
                <span class="task-priority ${task.priority}">${priorityNames[task.priority]}</span>
                ${task.date ? `<span class="task-date">📅 ${dateStr}</span>` : ''}
                ${task.time ? `<span class="task-date">🕐 ${task.time}</span>` : ''}
                ${task.reminder ? '<span class="task-date">🔔</span>' : ''}
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-edit">✏️</button>
            <button class="btn-delete">🗑️</button>
        </div>
    `;

    // Обработчики
    li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    li.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(task);
    });

    return li;
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveAllData();
        renderTasks();
        renderCalendar();
        renderStats();
        renderUpcoming();
    }
}

function deleteTask(id) {
    if (confirm('Удалить эту задачу?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveAllData();
        renderTasks();
        renderCalendar();
        renderReminders();
        renderStats();
        renderUpcoming();
    }
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    document.getElementById('tasks-count').textContent = `Всего: ${total}`;
    document.getElementById('completed-count').textContent = `Выполнено: ${completed}`;
}

// ==================== РЕДАКТИРОВАНИЕ ====================
let editingTaskId = null;

function openEditModal(task) {
    editingTaskId = task.id;
    document.getElementById('edit-task-input').value = task.text;
    document.getElementById('edit-task-category').value = task.category;
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-date').value = task.date;
    document.getElementById('edit-task-time').value = task.time;
    document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingTaskId = null;
}

function saveEdit() {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        task.text = document.getElementById('edit-task-input').value.trim();
        task.category = document.getElementById('edit-task-category').value;
        task.priority = document.getElementById('edit-task-priority').value;
        task.date = document.getElementById('edit-task-date').value;
        task.time = document.getElementById('edit-task-time').value;
        
        saveAllData();
        renderTasks();
        renderCalendar();
        renderUpcoming();
        closeModal();
    }
}

// ==================== ЗАМЕТКИ ====================
function saveNotes() {
    const notes = document.getElementById('notes-area').value;
    localStorage.setItem('planner-notes', notes);
    alert('Заметки сохранены!');
}

// ==================== НАПОМИНАНИЯ ====================
function renderReminders() {
    const container = document.getElementById('reminders-list');
    container.innerHTML = '';

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const reminders = tasks.filter(t => 
        t.reminder && 
        !t.completed && 
        t.date === today &&
        t.time &&
        t.time >= currentTime
    );

    if (reminders.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 13px;">Нет напоминаний на сегодня</p>';
        return;
    }

    reminders.forEach(task => {
        const item = document.createElement('div');
        item.className = 'reminder-item';
        item.innerHTML = `
            <strong>${task.time}</strong>: ${escapeHtml(task.text)}
        `;
        container.appendChild(item);
    });
}

function startReminderCheck() {
    setInterval(() => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const today = now.toISOString().split('T')[0];

        tasks.forEach(task => {
            if (task.reminder && !task.completed && task.date === today && task.time === currentTime) {
                if (Notification.permission === 'granted') {
                    new Notification('Напоминание о задаче', {
                        body: task.text,
                        icon: '📋'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification('Напоминание о задаче', {
                                body: task.text,
                                icon: '📋'
                            });
                        }
                    });
                } else {
                    alert(`Напоминание: ${task.text}`);
                }
            }
        });
    }, 60000); // Проверка каждую минуту
}

// ==================== СТАТИСТИКА ====================
function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completed-progress').style.width = `${percent}%`;
    document.getElementById('completed-percent').textContent = `${percent}%`;

    const byCategory = {};
    tasks.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    const categoryNames = {
        work: '💼 Работа',
        home: '🏠 Дом',
        study: '📚 Учёба',
        personal: '👤 Личное',
        health: '❤️ Здоровье',
        other: '📌 Другое'
    };

    const details = document.getElementById('stats-details');
    details.innerHTML = '';
    
    Object.entries(byCategory).forEach(([cat, count]) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span>${categoryNames[cat]}</span>
            <span>${count}</span>
        `;
        details.appendChild(div);
    });
}

// ==================== БЛИЖАЙШИЕ ЗАДАЧИ ====================
function renderUpcoming() {
    const container = document.getElementById('upcoming-tasks');
    container.innerHTML = '';

    const today = new Date();
    const upcoming = tasks
        .filter(t => !t.completed && new Date(t.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 13px;">Нет предстоящих задач</p>';
        return;
    }

    upcoming.forEach(task => {
        const item = document.createElement('div');
        item.className = 'upcoming-item';
        const dateObj = new Date(task.date);
        const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        item.innerHTML = `
            <strong>${dateStr}</strong>: ${escapeHtml(task.text)}
        `;
        container.appendChild(item);
    });
}

// ==================== УТИЛИТЫ ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== МОБИЛЬНАЯ НАВИГАЦИЯ ====================
function setupMobileNav() {
    // Кнопки открытия панелей
    const openCalendarBtn = document.getElementById('open-calendar');
    const openStatsBtn = document.getElementById('open-stats');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const closeRightSidebarBtn = document.getElementById('close-right-sidebar');
    const sidebarPanel = document.getElementById('sidebar-panel');
    const rightSidebarPanel = document.getElementById('right-sidebar-panel');

    // Открытие календаря
    if (openCalendarBtn) {
        openCalendarBtn.addEventListener('click', () => {
            sidebarPanel.classList.add('mobile-visible');
        });
    }

    // Открытие статистики
    if (openStatsBtn) {
        openStatsBtn.addEventListener('click', () => {
            rightSidebarPanel.classList.add('mobile-visible');
        });
    }

    // Закрытие панелей
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebarPanel.classList.remove('mobile-visible');
        });
    }

    if (closeRightSidebarBtn) {
        closeRightSidebarBtn.addEventListener('click', () => {
            rightSidebarPanel.classList.remove('mobile-visible');
        });
    }

    // Навигация через нижнее меню
    const navBtns = document.querySelectorAll('.mobile-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            
            // Переключение активной кнопки
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Действия в зависимости от панели
            if (panel === 'calendar') {
                sidebarPanel.classList.add('mobile-visible');
            } else if (panel === 'stats') {
                rightSidebarPanel.classList.add('mobile-visible');
            } else if (panel === 'notes') {
                // Прокрутка к заметкам
                const notesSection = document.querySelector('.notes-section');
                if (notesSection) {
                    sidebarPanel.classList.add('mobile-visible');
                    setTimeout(() => {
                        document.getElementById('notes-area').scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
            // tasks - остаёмся на главной
        });
    });
}
