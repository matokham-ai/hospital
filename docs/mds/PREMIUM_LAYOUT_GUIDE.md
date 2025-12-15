# Premium HMS Layout Guide

## Overview

The Premium HMS Layout is a cutting-edge, hospital-grade interface that combines modern design principles with advanced functionality. It features smooth gradients, rich dark mode support, glass-like panels, and refined transitions powered by Framer Motion.

## Key Features

### 🎨 Design System
- **Glass Morphism**: Translucent panels with backdrop blur effects
- **Premium Gradients**: Rich, medical-themed color gradients
- **Dark Mode**: Elegant dark theme with proper contrast ratios
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations

### ✨ Animations & Interactions
- **Framer Motion**: Smooth, spring-based animations
- **Micro-interactions**: Hover effects, button presses, and state changes
- **Page Transitions**: Seamless navigation between sections
- **Loading States**: Elegant shimmer and pulse effects

### 🏥 Hospital-Grade Features
- **Medical Color Coding**: Status indicators for critical, warning, stable conditions
- **Real-time Updates**: Live notification system with badges
- **Quick Actions**: Contextual buttons for common hospital workflows
- **Search & Filter**: Advanced search with glass morphism styling

## Components

### Layout Components

#### HMSLayout
The main layout wrapper that provides:
- Glass morphism sidebar with collapsible navigation
- Premium navbar with search, notifications, and user profile
- Animated background elements
- Dark mode toggle
- Responsive mobile menu

```tsx
import HMSLayout from '@/Layouts/HMSLayout';

<HMSLayout user={user}>
  {children}
</HMSLayout>
```

### Premium Components

#### PremiumCard
Glass-style cards with hover effects:
```tsx
<PremiumCard variant="feature" hover={true}>
  Content here
</PremiumCard>
```

Variants:
- `default`: Standard glass card
- `compact`: Smaller padding
- `feature`: Larger with enhanced styling
- `glass`: Pure glass morphism effect

#### PremiumButton
Animated buttons with gradients:
```tsx
<PremiumButton 
  variant="primary" 
  icon={Plus}
  gradient="from-blue-500 to-cyan-500"
>
  Action
</PremiumButton>
```

Variants:
- `primary`: Teal gradient (default)
- `secondary`: Glass morphism style
- `outline`: Border with transparent background
- `ghost`: Minimal styling
- `gradient`: Custom gradient support

#### PremiumInput
Enhanced form inputs with glass styling:
```tsx
<PremiumInput
  label="Patient Name"
  icon={User}
  variant="glass"
  placeholder="Enter name..."
/>
```

#### PremiumBadge
Status indicators with gradients:
```tsx
<PremiumBadge variant="success" icon={CheckCircle}>
  Stable
</PremiumBadge>
```

#### PremiumModal
Full-screen modals with backdrop blur:
```tsx
<PremiumModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Patient Details"
  size="lg"
>
  Modal content
</PremiumModal>
```

## CSS Classes

### Glass Morphism
```css
.glass-panel     /* Main glass effect for panels */
.glass-card      /* Glass effect for cards */
.glass-button    /* Glass effect for buttons */
```

### Gradients
```css
.gradient-primary    /* Teal to cyan */
.gradient-secondary  /* Blue to indigo */
.gradient-accent     /* Purple to pink */
.gradient-success    /* Emerald to teal */
.gradient-warning    /* Yellow to orange */
.gradient-danger     /* Red to pink */
```

### Text Gradients
```css
.text-gradient-primary    /* Primary text gradient */
.text-gradient-secondary  /* Secondary text gradient */
```

### Animations
```css
.animate-float           /* Gentle floating animation */
.animate-pulse-glow      /* Pulsing glow effect */
.animate-gradient-shift  /* Shifting gradient background */
.animate-shimmer         /* Loading shimmer effect */
```

### Medical Status
```css
.status-critical  /* Red gradient for critical */
.status-warning   /* Yellow gradient for warnings */
.status-stable    /* Green gradient for stable */
.status-info      /* Blue gradient for info */
```

## Color Palette

### Primary Colors
- **Teal**: `#14b8a6` - Primary actions, navigation
- **Cyan**: `#06b6d4` - Secondary actions, highlights
- **Slate**: `#64748b` - Text, borders, neutral elements

### Status Colors
- **Critical**: `#ef4444` to `#ec4899` (Red to Pink)
- **Warning**: `#f59e0b` to `#ea580c` (Yellow to Orange)
- **Success**: `#10b981` to `#14b8a6` (Emerald to Teal)
- **Info**: `#3b82f6` to `#6366f1` (Blue to Indigo)

### Glass Effects
- **Light Mode**: `rgba(255, 255, 255, 0.8)` with `backdrop-blur-xl`
- **Dark Mode**: `rgba(15, 23, 42, 0.8)` with `backdrop-blur-xl`

## Dark Mode

The layout automatically supports dark mode with:
- Proper contrast ratios for accessibility
- Adjusted glass morphism effects
- Enhanced gradients for dark backgrounds
- Consistent color schemes across all components

Toggle dark mode:
```tsx
const [darkMode, setDarkMode] = useState(false);
// Dark mode is applied via CSS classes
```

## Responsive Design

### Breakpoints
- **Mobile**: `< 768px` - Collapsible sidebar, stacked layout
- **Tablet**: `768px - 1024px` - Adaptive grid, compact navigation
- **Desktop**: `> 1024px` - Full layout with sidebar

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Swipe gestures for navigation
- Optimized glass effects for performance
- Reduced motion for battery saving

## Performance Considerations

### Optimizations
- **Backdrop Blur**: Limited to essential elements
- **Animations**: Respect `prefers-reduced-motion`
- **Gradients**: CSS-based for better performance
- **Images**: Lazy loading and WebP support

### Best Practices
- Use `transform` and `opacity` for animations
- Minimize backdrop-blur usage on mobile
- Implement proper loading states
- Cache gradient definitions

## Accessibility

### Features
- **High Contrast**: Support for `prefers-contrast: high`
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce`
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Blind**: Status indicators use icons + colors

### WCAG Compliance
- AA contrast ratios maintained
- Focus indicators visible
- Alternative text for icons
- Semantic HTML structure

## Usage Examples

### Dashboard Page
```tsx
export default function Dashboard({ user }) {
  return (
    <HMSLayout user={user}>
      <div className="space-y-8">
        <PremiumCard variant="feature">
          <h1 className="text-gradient-primary">Welcome to MediCare Pro</h1>
        </PremiumCard>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard>
            <PremiumBadge variant="success">Active</PremiumBadge>
            <h3>Patient Status</h3>
          </PremiumCard>
        </div>
      </div>
    </HMSLayout>
  );
}
```

### Form Page
```tsx
export default function PatientForm({ user }) {
  return (
    <HMSLayout user={user}>
      <PremiumCard variant="feature">
        <form className="space-y-6">
          <PremiumInput
            label="Patient Name"
            icon={User}
            variant="glass"
          />
          
          <div className="flex gap-4">
            <PremiumButton variant="secondary">
              Cancel
            </PremiumButton>
            <PremiumButton type="submit">
              Save Patient
            </PremiumButton>
          </div>
        </form>
      </PremiumCard>
    </HMSLayout>
  );
}
```

## Demo

Visit `/premium-demo` to see the layout in action with:
- Interactive components
- Real-time animations
- Dark mode toggle
- Responsive behavior
- All premium features

## Migration Guide

### From Existing Layout
The HMSLayout has been upgraded with premium features, so no import changes are needed:
   ```tsx
   // Same as before - now with premium features
   import HMSLayout from '@/Layouts/HMSLayout';
   ```

2. Update component usage:
   ```tsx
   // Old
   <div className="bg-white rounded-lg p-6">
   
   // New
   <PremiumCard variant="default">
   ```

3. Apply premium styles:
   ```tsx
   // Old
   <button className="bg-blue-500 text-white px-4 py-2 rounded">
   
   // New
   <PremiumButton variant="primary">
   ```

### CSS Migration
Import the premium styles in your CSS:
```css
@import './premium-layout.css';
```

## Browser Support

- **Chrome**: 88+ (full support)
- **Firefox**: 87+ (full support)
- **Safari**: 14+ (full support)
- **Edge**: 88+ (full support)

### Fallbacks
- Backdrop blur fallback for older browsers
- Gradient fallbacks for IE11
- Animation fallbacks for reduced motion

## Contributing

When adding new components:
1. Follow the glass morphism design pattern
2. Include dark mode support
3. Add proper animations with Framer Motion
4. Ensure accessibility compliance
5. Test on mobile devices
6. Document usage examples

## Support

For issues or questions about the premium layout:
1. Check the demo page for examples
2. Review the component documentation
3. Test in different browsers and devices
4. Ensure proper CSS imports