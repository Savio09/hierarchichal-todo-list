# My Assignment Progress for the Hierarchichal Todo List

# Description

This project is a hierarchichal todo list which enables one to organize tasks into lists. Those tasks could have subtasks that are associated with them. In the tangible product, which is a web application, we have a form which we can add create a list for. For the list which we create, we can also add tasks to those listed items. When we create a task, we can create a subtask. and create a sub subtask, that is each task can have a recursive depth of at most two.

### Models

From the description of the assignment some of the models that would be needed includes

- List (this would be the table to which a task belongs to)
- id
- name
- tasks Task [id] (A list can have many tasks)
- Task (this would be a table another table which would house multiple subtasks)
- id
- description
- List (this would be the single list to which the task belongs)
- Subtasks (this would be table of the subtasks for other)
