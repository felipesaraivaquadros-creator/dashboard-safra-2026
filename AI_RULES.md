# AI Rules & Tech Stack

## Tech Stack
- **Next.js 14**: Modern React framework using the App Router for simplified routing and server-side capabilities.
- **TypeScript**: Used for all new components and logic to ensure type safety and better developer experience.
- **Tailwind CSS**: Utility-first CSS framework for all styling, ensuring a consistent and responsive design.
- **shadcn/ui**: High-quality UI components built on top of Radix UI primitives for accessibility and customization.
- **Lucide React**: Comprehensive icon library for consistent visual language throughout the application.
- **Recharts**: Powerful charting library for data visualization and dashboards.
- **React Hooks**: Efficient state and lifecycle management using standard hooks (`useState`, `useMemo`, `useEffect`).

## Library Usage Rules
- **Styling**: Always use Tailwind CSS classes. Do not create new CSS files or use inline styles unless strictly necessary for dynamic values.
- **UI Components**: Check for existing shadcn/ui components before building from scratch. If a new component is needed, implement it following the shadcn/ui pattern.
- **Icons**: Exclusively use `lucide-react`. Ensure icons are sized consistently (default `size={20}` or `size={24}`).
- **Data Visualization**: Use `recharts` for all charts. Prefer `ResponsiveContainer` to ensure charts adapt to different screen sizes.
- **State Management**: Use React's built-in hooks for local and shared state. For complex data transformations, always wrap them in `useMemo`.
- **File Organization**:
  - Keep routes in the `app/` directory (Next.js standard).
  - Place reusable UI components in `/components`.
  - Maintain data processing scripts (like `normalizar-romaneios.js`) in the root for transparency.
- **Code Quality**: Use TypeScript for all new files. Aim for clean, readable code with descriptive variable names and minimal comments (prefer self-documenting code).
