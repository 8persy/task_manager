document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const apiUrl = 'http://localhost:3001/tasks';

    let tasks = [];

    // Функция для проверки доступности сервера
    async function checkServer() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Сервер недоступен');
            return true;
        } catch (error) {
            console.error('Ошибка при подключении к серверу:', error);
            alert('Сервер недоступен. Пожалуйста, запустите JSON Server.');
            return false;
        }
    }

    // Функция для загрузки задач с сервера
    async function fetchTasks() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Ошибка при загрузке задач');
            tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить задачи. Проверьте подключение к серверу.');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }

    // Функция для отображения задач
    // Функция для отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task');
            if (task.isEditing) {
                taskElement.classList.add('editing'); // Добавляем класс для режима редактирования
            }
            taskElement.setAttribute('data-id', task.id);

            if (task.isEditing) {
                // Режим редактирования
                taskElement.innerHTML = `
                <input type="text" class="edit-title" value="${task.title}" placeholder="Название задачи">
                <textarea class="edit-description" placeholder="Описание задачи">${task.description}</textarea>
                <select class="edit-priority">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Низкий</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Средний</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Высокий</option>
                </select>
                <input type="date" class="edit-due-date" value="${task.dueDate}">
                <div class="actions">
                    <button class="save">Сохранить</button>
                    <button class="cancel">Отмена</button>
                </div>
            `;
            } else {
                // Режим просмотра
                taskElement.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Приоритет: ${task.priority}</p>
                <p>Срок выполнения: ${task.dueDate}</p>
                <p>Статус: ${task.status}</p>
                <div class="actions">
                    <button class="edit">Редактировать</button>
                    <button class="delete">Удалить</button>
                    <button class="complete">${task.status === 'Завершено' ? 'Возобновить' : 'Завершить'}</button>
                </div>
            `;
            }

            // Добавляем обработчики событий
            if (task.isEditing) {
                const saveButton = taskElement.querySelector('.save');
                const cancelButton = taskElement.querySelector('.cancel');

                saveButton.addEventListener('click', () => saveTask(task.id));
                cancelButton.addEventListener('click', () => cancelEdit(task.id));
            } else {
                const editButton = taskElement.querySelector('.edit');
                const deleteButton = taskElement.querySelector('.delete');
                const completeButton = taskElement.querySelector('.complete');

                editButton.addEventListener('click', () => startEdit(task.id));
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                completeButton.addEventListener('click', () => toggleStatus(task.id));
            }

            taskList.prepend(taskElement);
        });
    }

    // Функция для начала редактирования задачи
    function startEdit(taskId) {
        tasks = tasks.map(task => ({
            ...task,
            isEditing: task.id === taskId ? true : false
        }));
        renderTasks(tasks);
    }

    // Функция для сохранения изменений
    async function saveTask(taskId) {
        const taskElement = document.querySelector(`.task[data-id="${taskId}"]`);
        const title = taskElement.querySelector('.edit-title').value;
        const description = taskElement.querySelector('.edit-description').value;
        const priority = taskElement.querySelector('.edit-priority').value;
        const dueDate = taskElement.querySelector('.edit-due-date').value;

        const updatedTask = {
            title,
            description,
            priority,
            dueDate
        };

        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });
            if (!response.ok) throw new Error('Ошибка при сохранении задачи');

            tasks = tasks.map(task => ({
                ...task,
                isEditing: false
            }));
            fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось сохранить задачу. Проверьте подключение к серверу.');
        }
    }

    // Функция для отмены редактирования
    function cancelEdit(taskId) {
        tasks = tasks.map(task => ({
            ...task,
            isEditing: false
        }));
        renderTasks(tasks);
    }

    // Функция для удаления задачи
    window.deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка при удалении задачи');
            fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось удалить задачу. Проверьте подключение к серверу.');
        }
    };

    // Функция для изменения статуса задачи
    window.toggleStatus = async (taskId) => {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'В процессе' ? 'Завершено' : 'В процессе';

        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({status: newStatus})
            });
            if (!response.ok) throw new Error('Ошибка при изменении статуса задачи');

            // Обновляем задачу в локальном массиве
            task.status = newStatus;

            // Перерисовываем задачи
            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось изменить статус задачи. Проверьте подключение к серверу.');
        }
    };

    // Функция для добавления задачи
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;

        if (title && dueDate) {
            const newTask = {
                title,
                description,
                priority,
                dueDate,
                status: 'В процессе',
                isEditing: false
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTask)
                });
                if (!response.ok) throw new Error('Ошибка при добавлении задачи');
                fetchTasks(); // Перезагружаем задачи
                taskForm.reset();
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось добавить задачу. Проверьте подключение к серверу.');
            }
        } else {
            alert('Пожалуйста, заполните все обязательные поля.');
        }
    });

    // Проверка сервера и загрузка задач
    checkServer().then(isServerAvailable => {
        if (isServerAvailable) {
            fetchTasks();
        }
    });
});