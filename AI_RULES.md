# Regras de IA e Stack Tecnológica

## Stack Tecnológica
- **Next.js 14**: Framework React moderno utilizando o App Router para roteamento simplificado e capacidades server-side.
- **TypeScript**: Utilizado para todos os novos componentes e lógica para garantir segurança de tipos e melhor experiência de desenvolvimento.
- **Tailwind CSS**: Framework CSS utility-first para toda a estilização, garantindo um design consistente e responsivo.
- **shadcn/ui**: Componentes de UI de alta qualidade construídos sobre os primitivos do Radix UI para acessibilidade e customização.
- **Lucide React**: Biblioteca de ícones abrangente para uma linguagem visual consistente em toda a aplicação.
- **Recharts**: Biblioteca de gráficos poderosa para visualização de dados e dashboards.
- **React Hooks**: Gerenciamento eficiente de estado e ciclo de vida usando hooks padrão (`useState`, `useMemo`, `useEffect`).

## Regras de Uso de Bibliotecas
- **Estilização**: Sempre use classes do Tailwind CSS. Não crie novos arquivos CSS ou use estilos inline, a menos que seja estritamente necessário para valores dinâmicos.
- **Componentes de UI**: Verifique se existem componentes shadcn/ui antes de construir do zero. Se um novo componente for necessário, implemente-o seguindo o padrão shadcn/ui.
- **Ícones**: Use exclusivamente `lucide-react`. Garanta que os ícones tenham tamanhos consistentes (padrão `size={20}` ou `size={24}`).
- **Visualização de Dados**: Use `recharts` para todos os gráficos. Prefira o `ResponsiveContainer` para garantir que os gráficos se adaptem a diferentes tamanhos de tela.
- **Gerenciamento de Estado**: Use os hooks nativos do React para estado local e compartilhado. Para transformações de dados complexas, sempre utilize `useMemo`.
- **Organização de Arquivos**:
  - Mantenha as rotas no diretório `app/` (padrão Next.js).
  - Coloque componentes de UI reutilizáveis em `/components`.
  - Mantenha scripts de processamento de dados (como `normalizar-romaneios.js`) na raiz para transparência.
- **Qualidade de Código**: Use TypeScript para todos os novos arquivos. Busque um código limpo e legível com nomes de variáveis descritivos e comentários mínimos (prefira código autodocumentado).
