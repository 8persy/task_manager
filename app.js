document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.querySelector('.form__task-form');
    const taskList = document.querySelector('.task-list');
    const apiUrl = 'http://localhost:3001/tasks';

    let tasks = [];

    // Ключ для Local Storage
    const localStorageKey = 'tasks';

    let editingTaskId = null; // ID задачи, которая сейчас редактируется

    // Функция для генерации уникального ID
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Функция для загрузки задач из Local Storage
    function loadTasksFromLocalStorage() {
        const storedTasks = localStorage.getItem(localStorageKey);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            // Убедимся, что у каждой задачи есть уникальный ID
            tasks.forEach(task => {
                if (!task.id) {
                    task.id = generateUniqueId(); // Генерируем ID, если его нет
                }
            });
            renderTasks(tasks);
        }
    }

    // Функция для сохранения задач в Local Storage
    function saveTasksToLocalStorage() {
        const tasksToSave = tasks.map(task => ({
            id: task.id, // Сохраняем ID задачи
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            status: task.status,
            isEditing: task.isEditing
        }));
        localStorage.setItem(localStorageKey, JSON.stringify(tasksToSave));
    }

    // Функция для проверки доступности сервера
    async function checkServer() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Сервер недоступен');
            return true;
        } catch (error) {
            console.error('Ошибка при подключении к серверу:', error);
            loadTasksFromLocalStorage(); // Загружаем задачи из Local Storage
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
            saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
        } catch (error) {
            console.error('Ошибка:', error);
            loadTasksFromLocalStorage(); // Загружаем задачи из Local Storage
        } finally {
            document.querySelector('.loading').style.display = 'none';
        }
    }

    // Функция для отображения задач
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-list__task');

            // Проверяем, редактируется ли эта задача
            if (task.id === editingTaskId) {
                taskElement.classList.add('editing'); // Добавляем класс для режима редактирования
            }

            taskElement.setAttribute('data-id', task.id);

            if (task.id === editingTaskId) {
                // Режим редактирования
                taskElement.innerHTML = '';

                let editTemplate = document.querySelector('#edit-template').content;
                let editElement = editTemplate.cloneNode(true);

                editElement.querySelector('.task-list__edit-title').value = task.title;
                editElement.querySelector('.task-list__edit-description').textContent = task.description;

                if (task.priority === 'low') {
                    editElement.querySelector('.task-list__edit-priority_value_low').setAttribute('selected', true);
                } else if (task.priority === 'medium') {
                    editElement.querySelector('.task-list__edit-priority_value_medium').setAttribute('selected', true);
                } else if (task.priority === 'high') {
                    editElement.querySelector('.task-list__edit-priority_value_high').setAttribute('selected', true);
                }

                editElement.querySelector('.task-list__edit-date').value = task.dueDate;

                taskElement.append(editElement);
            } else {
                // Режим просмотра
                taskElement.innerHTML = '';

                let taskTemplate = document.querySelector('#task-template').content;
                let taskTemplateElement = taskTemplate.cloneNode(true);

                taskTemplateElement.querySelector('.task-list__task-title').textContent = task.title;
                taskTemplateElement.querySelector('.task-list__task-description').textContent = task.description;
                taskTemplateElement.querySelector('.task-list__task-priority').textContent = task.priority;
                taskTemplateElement.querySelector('.task-list__task-date').textContent = task.dueDate;
                taskTemplateElement.querySelector('.task-list__task-status').textContent = task.status;

                if (task.status === 'Завершено') {
                    taskTemplateElement.querySelector('.task-list__task-actions_complete').textContent = 'Возобновить';
                } else {
                    taskTemplateElement.querySelector('.task-list__task-actions_complete').textContent = 'Завершить';
                }

                taskElement.append(taskTemplateElement);
            }

            // Добавляем обработчики событий
            if (task.id === editingTaskId) {
                const saveButton = taskElement.querySelector('.task-list__edit-actions_save');
                const cancelButton = taskElement.querySelector('.task-list__edit-actions_cancel');

                saveButton.addEventListener('click', () => saveTask(task.id));
                cancelButton.addEventListener('click', () => cancelEdit());
            } else {
                const editButton = taskElement.querySelector('.task-list__task-actions_edit');
                const deleteButton = taskElement.querySelector('.task-list__task-actions_delete');
                const completeButton = taskElement.querySelector('.task-list__task-actions_complete');

                editButton.addEventListener('click', () => startEdit(task.id));
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                completeButton.addEventListener('click', () => toggleStatus(task.id));
            }

            taskList.prepend(taskElement);
        });
        document.querySelector('.loading').style.display = 'none';
    }

    // Функция для начала редактирования задачи
    function startEdit(taskId) {
        editingTaskId = taskId; // Устанавливаем ID редактируемой задачи
        renderTasks(tasks); // Перерисовываем задачи
    }

    // Функция для сохранения задачи
    async function saveTask(taskId) {
        const taskElement = document.querySelector(`.task-list__task[data-id="${taskId}"]`);
        const title = taskElement.querySelector('.task-list__edit-title').value;
        const description = taskElement.querySelector('.task-list__edit-description').value;
        const priority = taskElement.querySelector('.task-list__edit-priority').value;
        const dueDate = taskElement.querySelector('.task-list__edit-date').value;

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

            editingTaskId = null; // Сбрасываем ID редактируемой задачи
            fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);
            editingTaskId = null;

            // Сохраняем изменения в Local Storage, если сервер недоступен
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
                saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
                renderTasks(tasks); // Перерисовываем задачи
            }

            alert('Сервер недоступен. Изменения сохранены локально.');
        }
    }

    // Функция для отмены редактирования
    function cancelEdit() {
        editingTaskId = null; // Сбрасываем ID редактируемой задачи
        renderTasks(tasks); // Перерисовываем задачи
    }

    // Функция для удаления задачи
    window.deleteTask = async (taskId) => {
        try {
            const response = await fetch(`${apiUrl}/${taskId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка при удалении задачи');
            await fetchTasks(); // Перезагружаем задачи
        } catch (error) {
            console.error('Ошибка:', error);

            // Удаляем задачу из Local Storage, если сервер недоступен
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
            renderTasks(tasks); // Перерисовываем задачи

            alert('Сервер недоступен. Задача удалена локально.');
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
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Ошибка при изменении статуса задачи');

            // Обновляем задачу в локальном массиве
            task.status = newStatus;

            // Перерисовываем задачи
            renderTasks(tasks);
        } catch (error) {
            console.error('Ошибка:', error);

            // Изменяем статус задачи в Local Storage, если сервер недоступен
            task.status = newStatus;
            saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
            renderTasks(tasks); // Перерисовываем задачи

            alert('Сервер недоступен. Статус задачи изменён локально.');
        }
    };

    // Функция для применения фильтров
    window.applyFilters = () => {
        const statusFilter = document.querySelector('.form__filter-status').value;
        const priorityFilter = document.querySelector('.form__filter-priority').value;
        const dueDateFilter = document.querySelector('.form__filter-date').value;

        let filteredTasks = tasks;

        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        if (dueDateFilter) {
            filteredTasks = filteredTasks.filter(task => task.dueDate === dueDateFilter);
        }

        renderTasks(filteredTasks);
    };

    // Функция для проверки даты
    function isValidDate(dateString) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Убираем время, чтобы сравнивать только даты
        return inputDate >= today;
    }

    // Функция для добавления задачи
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.querySelector('.form__task-title').value;
        const description = document.querySelector('.form__task-description').value;
        const priority = document.querySelector('.form__task-priority').value;
        const dueDate = document.querySelector('.form__task-date').value;

        if (!title || !dueDate) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        // Проверка даты
        if (!isValidDate(dueDate)) {
            alert('Срок выполнения должен быть датой в будущем.');
            return;
        }

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
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === 'Ошибка валидации') {
                    alert(`Ошибка валидации: ${errorData.details.map(d => d.message).join(', ')}`);
                } else {
                    throw new Error('Ошибка при добавлении задачи');
                }
            } else {
                const createdTask = await response.json();
                tasks.push(createdTask);
                saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
                renderTasks(tasks);
                taskForm.reset();
            }
        } catch (error) {
            console.error('Ошибка:', error);
            // Генерируем уникальный ID для задачи, если сервер недоступен
            newTask.id = generateUniqueId();
            tasks.push(newTask);
            saveTasksToLocalStorage(); // Сохраняем задачи в Local Storage
            renderTasks(tasks);
            alert('Сервер недоступен. Задача сохранена локально.');
        }
    });

    // Функция для синхронизации данных с сервером
    async function syncTasksWithServer() {
        const localTasks = JSON.parse(localStorage.getItem(localStorageKey)) || [];
        if (localTasks.length === 0) return;

        try {
            // Загружаем текущие задачи с сервера
            const serverTasksResponse = await fetch(apiUrl);
            if (!serverTasksResponse.ok) throw new Error('Ошибка при загрузке задач с сервера');
            const serverTasks = await serverTasksResponse.json();

            // Синхронизируем каждую задачу из Local Storage
            for (const localTask of localTasks) {
                // Проверяем, существует ли задача на сервере
                const existingTask = serverTasks.find(task => task.title === localTask.title && task.dueDate === localTask.dueDate);

                if (existingTask) {
                    // Если задача существует, обновляем её
                    const response = await fetch(`${apiUrl}/${existingTask.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(localTask)
                    });

                    if (!response.ok) {
                        throw new Error('Ошибка при обновлении задачи');
                    }
                } else {
                    // Если задача не существует, добавляем её
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(localTask)
                    });

                    if (!response.ok) {
                        throw new Error('Ошибка при добавлении задачи');
                    }
                }
            }

            localStorage.removeItem(localStorageKey); // Очищаем Local Storage после успешной синхронизации
            fetchTasks(); // Загружаем задачи с сервера
        } catch (error) {
            console.error('Ошибка при синхронизации задач:', error);
        }
    }

    // Проверка сервера и загрузка задач
    checkServer().then(isServerAvailable => {
        if (isServerAvailable) {
            syncTasksWithServer(); // Синхронизируем локальные данные с сервером
            fetchTasks(); // Загружаем задачи с сервера
        }
    });
});