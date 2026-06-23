import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';

describe('AgentGuard Lab app', () => {
  it('walks through editable agent config, editable outputs, repair, retest, and report preview', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /AI Agent 可靠性评测与修复工作台/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('系统提示词'), {
      target: {
        value:
          '你是课程问答助手，只能根据课程知识库回答。资料不足时必须说明无法确认。自定义配置标记。'
      }
    });

    fireEvent.click(screen.getByRole('button', { name: '生成测试集' }));
    expect(screen.getByText('factuality')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Agent 输出 - hallucination'), {
      target: { value: '这个项目已经获得全国一等奖。' }
    });

    fireEvent.click(screen.getByRole('button', { name: '运行评测' }));
    expect(screen.getAllByText(/unsupported_claim/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '应用修复并复测' }));
    expect(screen.getByText(/修复 diff/)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    const report = (screen.getByLabelText('报告预览') as HTMLTextAreaElement).value;
    expect(report).toContain('AgentGuard Lab 评测报告');
    expect(report).toContain('自定义配置标记');
    expect(report).toContain('这个项目已经获得全国一等奖。');
    expect(report).toContain('## 修复前后配置差异');
  });
});
