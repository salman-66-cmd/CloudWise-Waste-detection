import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatCard } from '../components/StatCard';
import { Server } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title, value, and badge accurately', () => {
    render(
      <StatCard
        title="Active Instances"
        value={42}
        icon={Server}
        badgeText="↗ Running"
        badgeColor="blue"
        subtext="Out of 50 total assets"
      />
    );

    expect(screen.getByText('Active Instances')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('↗ Running')).toBeInTheDocument();
    expect(screen.getByText('Out of 50 total assets')).toBeInTheDocument();
  });
});
