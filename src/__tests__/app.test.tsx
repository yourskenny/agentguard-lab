import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('AgentGuard Lab app', () => {
  it('walks through generate, evaluate, repair, retest, and report preview', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /AI Agent 可靠性评测与修复工作台/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '生成测试集' }));
    expect(screen.getByText('factuality')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '运行评测' }));
    expect(screen.getByText(/unsupported_claim/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '应用修复并复测' }));
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect((screen.getByLabelText('报告预览') as HTMLTextAreaElement).value).toContain('AgentGuard Lab 评测报告');
  });
});
