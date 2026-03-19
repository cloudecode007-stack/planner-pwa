# 🔑 Настройка GitHub MCP

## Шаг 1: Создайте Personal Access Token

1. Откройте [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Нажмите **Generate new token (classic)**
3. Введите название: `Qwen MCP`
4. Выберите срок действия: **No expiration** (или на ваш выбор)
5. Отметьте права доступа (scopes):
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
   - ✅ **read:org** (Read org membership)
   - ✅ **read:user** (Read user data)
   - ✅ **user:email** (Read user emails)
6. Нажмите **Generate token**
7. **Скопируйте токен** (он покажется один раз!)

## Шаг 2: Вставьте токен в mcp.json

Откройте файл `mcp.json` и замените `YOUR_GITHUB_TOKEN_HERE` на ваш токен:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## Шаг 3: Перезапустите Qwen Code

После перезапуска MCP сервер GitHub будет доступен автоматически.

## Доступные команды

После настройки вы сможете:
- Создавать репозитории
- Управлять issue и pull requests
- Работать с файлами репозитория
- Управлять workflows
- Получать информацию о репозиториях

## Безопасность

⚠️ **Не коммитьте файл mcp.json с токеном в Git!**

Файл `.gitignore` уже содержит `mcp.json`, поэтому токен не попадёт в репозиторий.
