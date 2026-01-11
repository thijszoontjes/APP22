/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../themed-text';

describe('ThemedText Component', () => {
  it('should render text correctly', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const { getByText } = render(
      <ThemedText style={{ fontSize: 20 }}>Styled Text</ThemedText>
    );
    const textElement = getByText('Styled Text');
    expect(textElement).toBeTruthy();
  });

  it('should handle different text types', () => {
    const { getByText } = render(
      <ThemedText type="title">Title Text</ThemedText>
    );
    expect(getByText('Title Text')).toBeTruthy();
  });

  it('should render with children', () => {
    const { getByText } = render(
      <ThemedText>
        <ThemedText>Child Text</ThemedText>
      </ThemedText>
    );
    expect(getByText('Child Text')).toBeTruthy();
  });
});
