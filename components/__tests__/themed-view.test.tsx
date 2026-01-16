/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemedView } from '../themed-view';

describe('ThemedView Component', () => {
  it('should render correctly', () => {
    const { root } = render(<ThemedView />);
    expect(root).toBeTruthy();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Test Content</Text>
      </ThemedView>
    );
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const { root } = render(
      <ThemedView style={{ padding: 20 }} />
    );
    expect(root).toBeTruthy();
  });

  it('should handle multiple children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
        <Text>Child 3</Text>
      </ThemedView>
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    expect(getByText('Child 3')).toBeTruthy();
  });
});
