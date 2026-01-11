/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedView } from '../themed-view';

describe('ThemedView Component', () => {
  it('should render correctly', () => {
    const { container } = render(<ThemedView />);
    expect(container).toBeTruthy();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <ThemedView>Test Content</ThemedView>
      </ThemedView>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const { container } = render(
      <ThemedView style={{ padding: 20 }} />
    );
    expect(container).toBeTruthy();
  });

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ThemedView>
        <ThemedView>Child 1</ThemedView>
        <ThemedView>Child 2</ThemedView>
        <ThemedView>Child 3</ThemedView>
      </ThemedView>
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    expect(getByText('Child 3')).toBeTruthy();
  });
});
